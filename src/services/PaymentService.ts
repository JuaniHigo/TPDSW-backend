// src/services/PaymentService.ts
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import QRCode from "qrcode";
import { Database } from "../config/database";
import { Compra, MetodoPago, EstadoPago } from "../entities/Compra.entity";
import { Entrada } from "../entities/Entrada.entity";
import { PrecioEventoSector } from "../entities/PrecioEventoSector.entity";

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
  async crearPreferenciaMercadoPago(
    data: PaymentData
  ): Promise<{ preferenceId: string }> {
    const em = Database.getEM().fork();

    try {
      await em.begin();

      // Buscar precio
      const precio = await em.getRepository(PrecioEventoSector).findOne({
        fkIdEvento: data.eventoId,
        fkIdSector: data.sectorId,
      });

      if (!precio) {
        throw new Error(
          "Precio no encontrado para el sector y evento especificados."
        );
      }

      const montoTotal = precio.precio * data.quantity;

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
        },
      });

      // Actualizar compra con ID de preferencia
      compra.idPreferenciaMP = preferenceResult.id!;
      await em.flush();

      await em.commit();
      return { preferenceId: preferenceResult.id! };
    } catch (error) {
      await em.rollback();
      throw error;
    }
  }

  async procesarPagoTarjeta(
    data: PaymentData
  ): Promise<{ message: string; id_compra: number }> {
    const em = Database.getEM().fork();

    try {
      await em.begin();

      // Buscar precio
      const precio = await em.getRepository(PrecioEventoSector).findOne({
        fkIdEvento: data.eventoId,
        fkIdSector: data.sectorId,
      });

      if (!precio) {
        throw new Error("Precio no encontrado.");
      }

      const montoTotal = precio.precio * data.quantity;

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
      await em.commit();

      return {
        message: "Compra procesada con éxito.",
        id_compra: compra.id,
      };
    } catch (error) {
      await em.rollback();
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
        await em.begin();

        const compra = await em.getRepository(Compra).findOne({
          id: parseInt(paymentInfo.external_reference),
        });

        if (compra) {
          compra.estadoPago = EstadoPago.COMPLETADA;
          compra.idPagoMP = paymentInfo.id?.toString();

          // Aquí podrías crear las entradas si no se hicieron antes
          // Esto depende de tu flujo de negocio específico

          await em.flush();
          await em.commit();
        }
      }
    } catch (error) {
      await em.rollback();
      throw error;
    }
  }
}
