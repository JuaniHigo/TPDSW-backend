import { Request, Response } from "express";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { orm } from "../app";
import { PreciosEventoSector } from "../entities/PreciosEventoSector";
import { Compras } from "../entities/Compras";
import { Entradas } from "../entities/Entradas";
import { Eventos } from "../entities/Eventos";
import { Usuarios } from "../entities/Usuarios";

import dotenv from "dotenv";
import QRCode from "qrcode";

dotenv.config();

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

// Función para generar entradas (la usaremos en MP y Tarjeta)
async function generarEntradas(
  em: typeof orm.em,
  id_compra: number,
  eventoId: number,
  sectorId: number,
  quantity: number
) {
  for (let i = 0; i < quantity; i++) {
    // Creamos la entrada
    const nuevaEntrada = em.create(Entradas, {
      fk_id_compra: id_compra,
      fk_id_evento: eventoId,
      fk_id_sector: sectorId,
      codigo_qr: "generating...", // QR temporal
    });

    await em.flush(); // Guardamos para obtener el ID de la entrada

    // Generamos el QR con el ID real
    const qrData = JSON.stringify({
      entradaId: nuevaEntrada.id_entrada,
      eventoId,
      compraId: id_compra,
    });
    nuevaEntrada.codigoQr = await QRCode.toDataURL(qrData);

    await em.flush(); // Actualizamos la entrada con el QR
  }
}

// Crear preferencia de Mercado Pago
export const crearPreferenciaMercadoPago = async (
  req: Request,
  res: Response
) => {
  const userId = (req.user as any)?.id_usuario;
  if (!userId) {
    return res.status(401).json({ message: "Usuario no autenticado." });
  }

  const { eventoId, sectorId, quantity } = req.body;
  if (!eventoId || !sectorId || !quantity) {
    return res
      .status(400)
      .json({ message: "Faltan datos (evento, sector, cantidad)." });
  }

  try {
    const { preferenceId, id_compra } = await orm.em.transactional(
      async (em) => {
        // 1. Obtener precio
        const precioData = await em.findOne(PreciosEventoSector, {
          fk_id_evento: eventoId,
          fk_id_sector: sectorId,
        });
        if (!precioData) {
          throw new Error("Precio no encontrado para el sector y evento.");
        }
        const monto_total = precioData.precio * Number(quantity);

        // 2. Crear la Compra
        const nuevaCompra = em.create(Compras, {
          fk_id_usuario: userId,
          monto_total,
          metodo_pago: "mercadopago",
          estado_pago: "pendiente",
          // fecha_compra se inserta por DEFAULT
        });
        await em.flush(); // Guardamos para obtener el ID de compra

        const id_compra = nuevaCompra.id_compra;

        // 3. Crear Preferencia de MP
        const preference = new Preference(client);
        const preferenceResult = await preference.create({
          body: {
            items: [
              {
                id: `evento-${eventoId}-sector-${sectorId}`,
                title: `Entrada Evento #${eventoId}`,
                description: `Entrada para el sector #${sectorId}`,
                quantity: Number(quantity),
                unit_price: Number(precioData.precio),
                currency_id: "ARS",
              },
            ],
            back_urls: {
              success: `${process.env.FRONTEND_URL}/compra-exitosa`,
              failure: `${process.env.FRONTEND_URL}/compra-fallida`,
            },
            auto_return: "approved",
            external_reference: id_compra.toString(),
            // Guardamos esto para el webhook
            metadata: { eventoId, sectorId, quantity: Number(quantity) },
          },
        });

        // 4. Actualizar Compra con ID de preferencia
        nuevaCompra.id_preferencia_mp = preferenceResult.id;
        await em.flush();

        return { preferenceId: preferenceResult.id, id_compra };
      }
    );

    res.status(201).json({ preferenceId });
  } catch (error: any) {
    console.error("Error al crear la preferencia:", error);
    res
      .status(500)
      .json({ message: "Error interno del servidor.", error: error.message });
  }
};

// Procesar pagos con tarjeta (simulado)
export const procesarPagoTarjeta = async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id_usuario;
  if (!userId) {
    return res.status(401).json({ message: "Usuario no autenticado." });
  }

  const { eventoId, sectorId, quantity } = req.body;
  if (!eventoId || !sectorId || !quantity) {
    return res.status(400).json({ message: "Faltan datos." });
  }

  try {
    const id_compra = await orm.em.transactional(async (em) => {
      // 1. Obtener precio
      const precioData = await em.findOne(PreciosEventoSector, {
        fk_id_evento: eventoId,
        fk_id_sector: sectorId,
      });
      if (!precioData) {
        throw new Error("Precio no encontrado.");
      }
      const monto_total = precioData.precio * Number(quantity);

      // 2. Crear la Compra
      const nuevaCompra = em.create(Compras, {
        fk_id_usuario: userId,
        monto_total,
        metodo_pago: "tarjeta",
        estado_pago: "completada",
      });
      await em.flush();

      // 3. Generar Entradas
      await generarEntradas(
        em,
        nuevaCompra.id_compra,
        eventoId,
        sectorId,
        Number(quantity)
      );

      return nuevaCompra.id_compra;
    });

    res.status(201).json({ message: "Compra procesada con éxito.", id_compra });
  } catch (error: any) {
    console.error("Error al procesar pago con tarjeta:", error);
    res
      .status(500)
      .json({ message: "Error interno del servidor.", error: error.message });
  }
};

// Webhook de Mercado Pago
export const recibirConfirmacionPago = async (req: Request, res: Response) => {
  const { data } = req.body;

  if (data && data.id) {
    // Usamos un 'fork' del EM para un contexto aislado (¡CRÍTICO!)
    const em = orm.em.fork();

    try {
      const payment = new Payment(client);
      const paymentInfo = await payment.get({ id: data.id });

      if (
        paymentInfo &&
        paymentInfo.status === "approved" &&
        paymentInfo.external_reference
      ) {
        const id_compra = parseInt(paymentInfo.external_reference);

        await em.transactional(async (txEm) => {
          const compra = await txEm.findOne(Compras, { id_compra });

          if (!compra || compra.estado_pago === "completada") {
            // Si no existe o ya fue procesada, salimos
            return;
          }

          // 1. Actualizar la compra
          compra.estado_pago = "completada";
          compra.id_pago_mp = paymentInfo.id?.toString();

          // 2. Obtener datos para crear entradas (desde metadata)
          const { eventoId, sectorId, quantity } = paymentInfo.metadata;

          if (eventoId && sectorId && quantity) {
            // 3. Generar Entradas
            await generarEntradas(
              txEm,
              id_compra,
              eventoId,
              sectorId,
              quantity
            );
          } else {
            throw new Error(`Faltan metadatos en el pago ${paymentInfo.id}`);
          }
        });
      }
    } catch (error) {
      console.error("Error en el webhook de Mercado Pago:", error);
    }
  }
  res.status(200).send("OK");
};

// Obtener entradas por compra
export const getEntradasPorCompra = async (req: Request, res: Response) => {
  const { id_compra } = req.params;
  const userId = (req.user as any)?.id_usuario;

  try {
    // Verificamos que la compra pertenezca al usuario
    const compra = await orm.em.findOne(Compras, {
      id_compra: +id_compra,
      fk_id_usuario: userId,
    });

    if (!compra) {
      return res
        .status(404)
        .json({ message: "Compra no encontrada o no pertenece al usuario." });
    }

    // Obtenemos las entradas y populamos las relaciones necesarias
    const entradas = await orm.em.getRepository(Entradas).find(
      { fk_id_compra: +id_compra },
      {
        populate: [
          "fk_id_evento.fk_id_club_local",
          "fk_id_evento.fk_id_club_visitante",
        ],
      }
    );

    // Aplanamos la data como en tu consulta original
    const dataAplanada = entradas.map((e) => ({
      id_entrada: e.id_entrada,
      codigo_qr: e.codigo_qr,
      nombre_local: e.fk_id_evento.fk_id_club_local.nombre,
      nombre_visitante: e.fk_id_evento.fk_id_club_visitante.nombre,
    }));

    res.status(200).json(dataAplanada);
  } catch (error: any) {
    console.error("Error detallado al obtener entradas:", error);
    res.status(500).json({
      message: "Error al obtener las entradas.",
      error: error.message,
    });
  }
};
