// src/services/PaymentService.ts
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import QRCode from "qrcode";
import { Database } from "../config/database"; // <-- Ya estaba bien
import { Compra, MetodoPago, EstadoPago } from "../entities/Compra.entity";
import { Entrada } from "../entities/Entrada.entity";
import { PrecioEventoSector } from "../entities/PrecioEventoSector.entity";
import { NotFoundError } from "../utils/errors";
import { EntityManager } from "@mikro-orm/core";
import { CompraRepository } from "../repositories/CompraRepository";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

interface PaymentData {
  eventoId: number;
  sectorId: number;
  quantity: number;
  userId: number;
}

export class PaymentService {
  // No guardamos 'em' en el constructor, lo obtenemos por método
  // para asegurar que sea el de la request actual.

  async crearPreferenciaMercadoPago(
    data: PaymentData
  ): Promise<{ preferenceId: string }> {
    const em = Database.getEM().fork(); // Fork para la transacción

    try {
      return await em.transactional(async (em) => {
        // Buscar precio
        const precio = await em.getRepository(PrecioEventoSector).findOne({
          fkIdEvento: data.eventoId,
          fkIdSector: data.sectorId,
        });

        if (!precio) {
          throw new NotFoundError(
            "Precio no encontrado para el sector y evento especificados."
          );
        }

        const montoTotal = Number(precio.precio) * data.quantity;

        // Crear compra
        const compra = new Compra({
          fkIdUsuario: data.userId,
          montoTotal,
          metodoPago: MetodoPago.MERCADOPAGO,
          estadoPago: EstadoPago.PENDIENTE,
        });

        em.persist(compra);
        await em.flush(); // Para obtener el ID

        // Crear preferencia de MercadoPago
        const preference = new Preference(client);
        const preferenceResult = await preference.create({
          body: {
            items: [
              {
                id: `evento-${data.eventoId}-sector-${data.sectorId}`,
                title: `Entrada Evento #${data.eventoId}`,
                description: `Entrada para el sector #${data.sectorId}`,
                quantity: data.quantity,
                unit_price: Number(precio.precio),
                currency_id: "ARS",
              },
            ],
            back_urls: {
              success: `${process.env.FRONTEND_URL}/compra-exitosa`,
              failure: `${process.env.FRONTEND_URL}/compra-fallida`,
            },
            auto_return: "approved",
            external_reference: compra.id.toString(),
            // Guardamos los datos de la compra para el webhook
            metadata: {
              eventoId: data.eventoId,
              sectorId: data.sectorId,
              quantity: data.quantity,
            },
          },
        });

        // Actualizar compra con ID de preferencia
        compra.idPreferenciaMP = preferenceResult.id!;
        await em.flush();

        return { preferenceId: preferenceResult.id! };
      });
    } catch (error) {
      throw error;
    }
  }

  async procesarPagoTarjeta(
    data: PaymentData
  ): Promise<{ message: string; id_compra: number }> {
    const em = Database.getEM().fork();

    try {
      return await em.transactional(async (em) => {
        // Buscar precio
        const precio = await em.getRepository(PrecioEventoSector).findOne({
          fkIdEvento: data.eventoId,
          fkIdSector: data.sectorId,
        });

        if (!precio) {
          throw new NotFoundError("Precio no encontrado.");
        }

        const montoTotal = Number(precio.precio) * data.quantity;

        // Crear compra
        const compra = new Compra({
          fkIdUsuario: data.userId,
          montoTotal,
          metodoPago: MetodoPago.TARJETA,
          estadoPago: EstadoPago.COMPLETADA,
        });

        em.persist(compra);
        await em.flush();

        // Crear entradas con códigos QR
        for (let i = 0; i < data.quantity; i++) {
          const entrada = new Entrada({
            fkIdCompra: compra.id,
            fkIdEvento: data.eventoId,
            fkIdSector: data.sectorId,
            codigoQr: "generating...", // Temporal
            compra: em.getReference(Compra, compra.id),
            evento: em.getReference(PrecioEventoSector, [
              data.eventoId,
              data.sectorId,
            ]).evento,
            sector: em.getReference(PrecioEventoSector, [
              data.eventoId,
              data.sectorId,
            ]).sector,
          });

          em.persist(entrada);
          await em.flush(); // Para obtener el ID

          // Generar QR real
          const qrData = JSON.stringify({
            entradaId: entrada.id,
            eventoId: data.eventoId,
            compraId: compra.id,
          });
          entrada.codigoQr = await QRCode.toDataURL(qrData);
        }

        await em.flush();

        return {
          message: "Compra procesada con éxito.",
          id_compra: compra.id,
        };
      });
    } catch (error) {
      throw error;
    }
  }

  async procesarWebhookMercadoPago(paymentId: string): Promise<void> {
    const em = Database.getEM().fork();

    try {
      const payment = new Payment(client);
      const paymentInfo = await payment.get({ id: paymentId });

      if (
        paymentInfo?.status === "approved" &&
        paymentInfo.external_reference
      ) {
        await em.transactional(async (em) => {
          const compra = await em.getRepository(Compra).findOne({
            id: parseInt(paymentInfo.external_reference!),
          });

          if (compra && compra.estadoPago === EstadoPago.PENDIENTE) {
            compra.estadoPago = EstadoPago.COMPLETADA;
            compra.idPagoMP = paymentInfo.id?.toString();

            // Lógica para crear las entradas (datos guardados en metadata)
            const metadata = paymentInfo.metadata as any;
            if (
              metadata &&
              metadata.eventoId &&
              metadata.sectorId &&
              metadata.quantity
            ) {
              for (let i = 0; i < metadata.quantity; i++) {
                const entrada = new Entrada({
                  fkIdCompra: compra.id,
                  fkIdEvento: metadata.eventoId,
                  fkIdSector: metadata.sectorId,
                  codigoQr: "generating...",
                  compra: em.getReference(Compra, compra.id),
                  evento: em.getReference(PrecioEventoSector, [
                    metadata.eventoId,
                    metadata.sectorId,
                  ]).evento,
                  sector: em.getReference(PrecioEventoSector, [
                    metadata.eventoId,
                    metadata.sectorId,
                  ]).sector,
                });
                em.persist(entrada);
                await em.flush();

                const qrData = JSON.stringify({
                  entradaId: entrada.id,
                  eventoId: metadata.eventoId,
                  compraId: compra.id,
                });
                entrada.codigoQr = await QRCode.toDataURL(qrData);
              }
            }
            await em.flush();
          }
        });
      }
    } catch (error) {
      throw error;
    }
  }

  async getEntradasPorCompra(
    compraId: number,
    userId: number
  ): Promise<Entrada[]> {
    const em = Database.getEM();
    const compraRepo = em.getRepository(Compra) as CompraRepository;

    // Primero, validamos que la compra pertenezca al usuario
    const compra = await compraRepo.findOne({
      id: compraId,
      fkIdUsuario: userId,
    });
    if (!compra) {
      throw new NotFoundError("Compra no encontrada o no pertenece al usuario");
    }

    // Si pertenece, buscamos las entradas con sus relaciones
    const entradas = await em.getRepository(Entrada).find(
      { fkIdCompra: compraId },
      {
        populate: [
          "evento",
          "evento.clubLocal",
          "evento.clubVisitante",
          "sector",
        ],
      }
    );

    return entradas;
  }
}
