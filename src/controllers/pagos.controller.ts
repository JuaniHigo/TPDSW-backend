import { Request, Response } from "express";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import dotenv from "dotenv";
import QRCode from "qrcode";

// ✅ CAMBIO 1: Importamos 'orm' (que ahora sí se exporta) y RequestContext
import { orm } from "../app";
import { EntityManager, RequestContext } from "@mikro-orm/core";

// ✅ CAMBIO 2: Usamos TODOS los nombres de entidad en SINGULAR
import { PrecioEventoSector } from "../entities/PrecioEventoSector";
import { Compra } from "../entities/Compra";
import { Entrada } from "../entities/Entrada";
import { Evento } from "../entities/Evento"; 
import { Usuario } from "../entities/Usuario"; 
import { Sector } from "../entities/Sector";

dotenv.config();

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

// ✅ CAMBIO 3: Tipamos 'em' correctamente y usamos camelCase/Singular
async function generarEntradas(
  em: EntityManager, // Tipo correcto
  idCompra: number,
  eventoId: number,
  sectorId: number,
  quantity: number
) {
  for (let i = 0; i < quantity; i++) {
    // Creamos la entrada
    const nuevaEntrada = em.create(Entrada, {
      fkIdCompra: idCompra, // camelCase
      fkIdEvento: eventoId, // camelCase
      fkIdSector: em.getReference(Sector, sectorId),
      codigoQr: "generating...", // camelCase
    });

    await em.flush(); // Guardamos para obtener el ID

    // Generamos el QR con el ID real
    const qrData = JSON.stringify({
      entradaId: nuevaEntrada.idEntrada, // camelCase
      eventoId,
      compraId: idCompra,
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
  // ✅ CAMBIO 4: Usamos 'idUsuario' (camelCase)
  const userId = (req.user as any)?.idUsuario;
  if (!userId) {
    return res.status(401).json({ message: "Usuario no autenticado." });
  }

  const { eventoId, sectorId, quantity } = req.body;
  if (!eventoId || !sectorId || !quantity) {
    return res
      .status(400)
      .json({ message: "Faltan datos (evento, sector, cantidad)." });
  }

  // ✅ CAMBIO 5: Usamos RequestContext para esta ruta de usuario
  const em = RequestContext.getEntityManager()!;

  try {
    // ✅ Usamos 'em.transactional'
    const { preferenceId, idCompra } = await em.transactional(async (txEm) => {
      // 1. Obtener precio
      // ✅ Usamos txEm, Singular y camelCase
      const precioData = await txEm.findOne(PrecioEventoSector, {
        fkIdEvento: eventoId,
        fkIdSector: sectorId,
      });
      if (!precioData) {
        throw new Error("Precio no encontrado para el sector y evento.");
      }
      const montoTotal = Number(precioData.precio) * Number(quantity);

      // 2. Crear la Compra
      // ✅ Usamos txEm, Singular y camelCase
      const nuevaCompra = txEm.create(Compra, {
        fkUsuario: userId,
        montoTotal: montoTotal.toString(), // Aseguramos que sea string si el tipo es decimal
        metodoPago: "mercadopago",
        estadoPago: "pendiente",
      });
      await txEm.flush(); // Guardamos para obtener el ID

      const idCompra = nuevaCompra.idCompra; // camelCase

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
          external_reference: idCompra.toString(), // camelCase
          metadata: { eventoId, sectorId, quantity: Number(quantity) },
        },
      });

      // 4. Actualizar Compra con ID de preferencia
      nuevaCompra.idPreferenciaMp = preferenceResult.id; // camelCase
      await txEm.flush();

      return { preferenceId: preferenceResult.id, idCompra };
    });

    res.status(201).json({ preferenceId, idCompra }); // Devolvemos ambos
  } catch (error: any) {
    console.error("Error al crear la preferencia:", error);
    res
      .status(500)
      .json({ message: "Error interno del servidor.", error: error.message });
  }
};

// Procesar pagos con tarjeta (simulado)
export const procesarPagoTarjeta = async (req: Request, res: Response) => {
  // ✅ CAMBIO 6: Usamos 'idUsuario' (camelCase)
  const userId = (req.user as any)?.idUsuario;
  if (!userId) {
    return res.status(401).json({ message: "Usuario no autenticado." });
  }

  const { eventoId, sectorId, quantity } = req.body;
  if (!eventoId || !sectorId || !quantity) {
    return res.status(400).json({ message: "Faltan datos." });
  }

  // ✅ CAMBIO 7: Usamos RequestContext
  const em = RequestContext.getEntityManager()!;

  try {
    const idCompra = await em.transactional(async (txEm) => {
      // 1. Obtener precio
      // ✅ Usamos txEm, Singular y camelCase
      const precioData = await txEm.findOne(PrecioEventoSector, {
        fkIdEvento: eventoId,
        fkIdSector: sectorId,
      });
      if (!precioData) {
        throw new Error("Precio no encontrado.");
      }
      const montoTotal = Number(precioData.precio) * Number(quantity);

      // 2. Crear la Compra
      // ✅ Usamos txEm, Singular y camelCase
      const nuevaCompra = txEm.create(Compra, {
        fkUsuario: userId,
        montoTotal: montoTotal.toString(),
        metodoPago: "tarjeta",
        estadoPago: "completada",
      });
      await txEm.flush();

      // 3. Generar Entradas
      await generarEntradas(
        txEm,
        nuevaCompra.idCompra, // camelCase
        eventoId,
        sectorId,
        Number(quantity)
      );

      return nuevaCompra.idCompra; // camelCase
    });

    res.status(201).json({ message: "Compra procesada con éxito.", idCompra });
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
    // ✅ CAMBIO 8: Usamos 'orm.em.fork()' porque ESTO NO TIENE REQUEST CONTEXT
    // Esto funciona gracias al cambio que hicimos en app.ts
    const em = orm.em.fork();

    try {
      const payment = new Payment(client);
      const paymentInfo = await payment.get({ id: data.id });

      if (
        paymentInfo &&
        paymentInfo.status === "approved" &&
        paymentInfo.external_reference
      ) {
        const idCompra = parseInt(paymentInfo.external_reference); // camelCase

        await em.transactional(async (txEm) => {
          // ✅ Usamos txEm, Singular y camelCase
          const compra = await txEm.findOne(Compra, { idCompra });

          if (!compra || compra.estadoPago === "completada") { // camelCase
            return; // Ya fue procesada
          }

          // 1. Actualizar la compra
          compra.estadoPago = "completada"; // camelCase
          compra.idPagoMp = paymentInfo.id?.toString(); // camelCase

          // 2. Obtener datos para crear entradas (desde metadata)
          const { eventoId, sectorId, quantity } = paymentInfo.metadata;

          if (eventoId && sectorId && quantity) {
            // 3. Generar Entradas
            await generarEntradas(
              txEm,
              idCompra,
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
  res.status(200).send("OK"); // Siempre responder 200 a MP
};

// Obtener entradas por compra
export const getEntradasPorCompra = async (req: Request, res: Response) => {
  // ✅ CAMBIO 9: Usamos camelCase
  const { idCompra } = req.params; 
  const userId = (req.user as any)?.idUsuario;

  // ✅ CAMBIO 10: Usamos RequestContext
  const em = RequestContext.getEntityManager()!;

  try {
    // Verificamos que la compra pertenezca al usuario
    // ✅ Usamos em, Singular y camelCase
    const compra = await em.findOne(Compra, {
      idCompra: +idCompra,
      fkUsuario: userId,
    });

    if (!compra) {
      return res
        .status(404)
        .json({ message: "Compra no encontrada o no pertenece al usuario." });
    }

    // Obtenemos las entradas y populamos las relaciones necesarias
    // ✅ Usamos em, Singular y camelCase
    const entradas = await em.getRepository(Entrada).find(
      { fkIdCompra: +idCompra },
      {
        populate: [
          "fkIdEvento.fkIdClubLocal", // camelCase
          "fkIdEvento.fkIdClubVisitante", // camelCase
        ],
      }
    );

    // Aplanamos la data
    const dataAplanada = entradas.map((e) => ({
      idEntrada: e.idEntrada, // camelCase
      codigoQr: e.codigoQr, // camelCase
      nombreLocal: e.fkIdEvento.fkIdClubLocal.nombre, // camelCase
      nombreVisitante: e.fkIdEvento.fkIdClubVisitante.nombre, // camelCase
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