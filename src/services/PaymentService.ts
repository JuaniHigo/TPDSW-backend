// src/services/PaymentService.ts
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import QRCode from "qrcode";
import { Database } from "../config/database.js";
import { Compra, MetodoPago, EstadoPago } from "../entities/Compra.entity.js";
import { Entrada } from "../entities/Entrada.entity.js";
import { PrecioEventoSector } from "../entities/PrecioEventoSector.entity.js";
import { Evento } from "../entities/Evento.entity.js";
import { Sector } from "../entities/Sector.entity.js";
import { NotFoundError } from "../utils/errors.js";
import { EntityManager } from "@mikro-orm/core";
import { CompraRepository } from "../repositories/CompraRepository.js";

// Verificamos la variable de entorno ANTES de usarla
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  // Lanzamos un ERROR REAL, que Node.js SÍ sabe cómo imprimir.
  throw new Error(
    "⛔ Variable de entorno MERCADOPAGO_ACCESS_TOKEN no definida. Revisa tu archivo .env"
  );
}

const client = new MercadoPagoConfig({
  accessToken: accessToken,
});

interface PaymentData {
  eventoId: number;
  sectorId: number;
  quantity: number;
  userId: number;
}

export class PaymentService {
  // ... (crearPreferenciaMercadoPago) ...
  async crearPreferenciaMercadoPago(
    data: PaymentData
  ): Promise<{ preferenceId: string }> {
    const em = Database.getEM().fork(); // Fork para la transacción

    try {
      return await em.transactional(async (em) => {
        // Buscar precio (Asumimos que PrecioEventoSector.entity.ts aún usa fkId... por ahora)
        const precio = await em.getRepository(PrecioEventoSector).findOne({
          evento: data.eventoId,
          sector: { idSector: data.sectorId }, // Correct: Filter by the 'idSector' part of the composite key
        });
        if (!precio) {
          throw new NotFoundError(
            "Precio no encontrado para el sector y evento especificados."
          );
        }

        const montoTotal = Number(precio.precio) * data.quantity;

        // --- CORRECCIÓN (Compra) ---
        // Usamos la relación 'usuario' en lugar de 'fkIdUsuario'
        const compra = new Compra({
          usuario: data.userId, // <-- CORREGIDO
          montoTotal,
          metodoPago: MetodoPago.MERCADOPAGO,
          estadoPago: EstadoPago.PENDIENTE,
        });
        // --- FIN CORRECCIÓN ---

        em.persist(compra);
        await em.flush(); // Para obtener el ID

        // ... (resto de la preferencia de MP) ...
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
            metadata: {
              eventoId: data.eventoId,
              sectorId: data.sectorId,
              quantity: data.quantity,
            },
          },
        });

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
        // Buscar precio (Asumimos que PrecioEventoSector.entity.ts aún usa fkId... por ahora)
        const precio = await em.getRepository(PrecioEventoSector).findOne({
          evento: data.eventoId,
          sector: { idSector: data.sectorId }, // Correct: Filter by the 'idSector' part of the composite key
        });

        if (!precio) {
          throw new NotFoundError("Precio no encontrado.");
        }

        const montoTotal = Number(precio.precio) * data.quantity;

        // --- CORRECCIÓN (Compra) ---
        // Usamos la relación 'usuario' en lugar de 'fkIdUsuario'
        const compra = new Compra({
          usuario: data.userId, // <-- CORREGIDO
          montoTotal,
          metodoPago: MetodoPago.TARJETA,
          estadoPago: EstadoPago.COMPLETADA,
        });
        // --- FIN CORRECCIÓN ---

        em.persist(compra);
        await em.flush();

        // Crear entradas con códigos QR
        for (let i = 0; i < data.quantity; i++) {
          const sectorId = data.sectorId;
          const evento = await em.findOne(Evento, data.eventoId, {
            populate: ["estadio"],
          });
          const estadioId = evento?.estadio.id;
          if (!estadioId) {
            throw new Error("No se pudo encontrar el estadio para el evento");
          }

          // --- CORRECCIÓN (Entrada - L.154) ---
          // Eliminamos las propiedades 'fkId...' redundantes
          const entrada = new Entrada({
            // fkIdCompra: compra.id, // <-- ELIMINADO
            // fkIdEvento: data.eventoId, // <-- ELIMINADO
            // fkIdSector: data.sectorId, // <-- ELIMINADO
            codigoQr: "generating...", // Temporal
            compra: em.getReference(Compra, compra.id),
            evento: em.getReference(Evento, data.eventoId),
            sector: em.getReference(Sector, [sectorId, estadioId]),
          });
          // --- FIN CORRECCIÓN ---

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

            const metadata = paymentInfo.metadata as any;
            if (
              metadata &&
              metadata.eventoId &&
              metadata.sectorId &&
              metadata.quantity
            ) {
              // --- CORRECCIÓN (Webhook) ---
              // Necesitamos el estadioId para la clave compuesta del Sector
              const sectorId = metadata.sectorId;
              const evento = await em.findOne(Evento, metadata.eventoId, {
                populate: ["estadio"],
              });
              const estadioId = evento?.estadio.id;
              if (!estadioId) {
                throw new Error(
                  "No se pudo encontrar el estadio para el evento"
                );
              }
              // --- FIN CORRECCIÓN ---

              for (let i = 0; i < metadata.quantity; i++) {
                // --- CORRECCIÓN (Entrada - L.216) ---
                // Eliminamos las propiedades 'fkId...' redundantes
                const entrada = new Entrada({
                  // fkIdCompra: compra.id, // <-- ELIMINADO
                  // fkIdEvento: metadata.eventoId, // <-- ELIMINADO
                  // fkIdSector: metadata.sectorId, // <-- ELIMINADO
                  codigoQr: "generating...",
                  compra: em.getReference(Compra, compra.id),
                  evento: em.getReference(Evento, metadata.eventoId),
                  // Usamos la clave compuesta correcta
                  sector: em.getReference(Sector, [sectorId, estadioId]), // <-- CORREGIDO
                });
                // --- FIN CORRECCIÓN ---

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

    // --- CORRECCIÓN (Compra - L.256) ---
    // Usamos la relación 'usuario' en lugar de 'fkIdUsuario'
    const compra = await compraRepo.findOne({
      id: compraId,
      usuario: userId, // <-- CORREGIDO
    });
    // --- FIN CORRECCIÓN ---

    if (!compra) {
      throw new NotFoundError("Compra no encontrada o no pertenece al usuario");
    }

    // --- CORRECCIÓN (Entrada - L.265) ---
    // Usamos la relación 'compra' en lugar de 'fkIdCompra'
    const entradas = await em.getRepository(Entrada).find(
      { compra: compraId }, // <-- CORREGIDO
      {
        populate: [
          "evento",
          "evento.clubLocal",
          "evento.clubVisitante",
          "sector",
          "sector.estadio",
        ],
      }
    );
    // --- FIN CORRECCIÓN ---

    return entradas;
  }
}
