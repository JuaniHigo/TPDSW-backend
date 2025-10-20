// src/controllers/pagos.controller.ts
import { Request, Response } from "express";
import { PaymentService } from "../services/PaymentService"; // <-- Importa el servicio
import { NotFoundError } from "../utils/errors";
import { parseIntOr } from "../utils/parser.utils";

const paymentService = new PaymentService();

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
    const result = await paymentService.crearPreferenciaMercadoPago({
      userId,
      eventoId: Number(eventoId),
      sectorId: Number(sectorId),
      quantity: Number(quantity),
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error al crear la preferencia:", error);
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Error interno del servidor." });
    }
  }
};

export const procesarPagoTarjeta = async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id_usuario;
  if (!userId) {
    return res.status(401).json({ message: "Usuario no autenticado." });
  }

  const { eventoId, sectorId, quantity } = req.body;
  if (!eventoId || !sectorId || !quantity) {
    return res
      .status(400)
      .json({ message: "Faltan datos para procesar la compra." });
  }

  try {
    const result = await paymentService.procesarPagoTarjeta({
      userId,
      eventoId: Number(eventoId),
      sectorId: Number(sectorId),
      quantity: Number(quantity),
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error al procesar pago con tarjeta:", error);
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Error interno del servidor." });
    }
  }
};

export const recibirConfirmacionPago = async (req: Request, res: Response) => {
  const { data } = req.body;
  if (data && data.id) {
    try {
      await paymentService.procesarWebhookMercadoPago(data.id);
    } catch (error) {
      console.error("Error en el webhook de Mercado Pago:", error);
      // No devolvemos 500 a MP, podría reintentar indefinidamente
    }
  }
  res.status(200).send("OK"); // Siempre OK a MercadoPago
};

export const getEntradasPorCompra = async (req: Request, res: Response) => {
  const { id_compra } = req.params;
  const userId = (req.user as any)?.id_usuario;

  try {
    const compraId = parseIntOr(id_compra, 0);
    const entradas = await paymentService.getEntradasPorCompra(
      compraId,
      userId
    );

    // Mapeamos para dar una respuesta amigable
    const response = entradas.map((e) => ({
      id_entrada: e.id,
      codigo_qr: e.codigoQr,
      nombre_local: e.evento.clubLocal.nombre,
      nombre_visitante: e.evento.clubVisitante.nombre,
      sector: e.sector.nombreSector,
      estadio: e.evento.estadio.nombre,
      fecha: e.evento.fechaHora,
    }));

    res.status(200).json(response);
  } catch (error: any) {
    console.error("Error detallado al obtener entradas:", error);
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Error al obtener las entradas." });
    }
  }
};
