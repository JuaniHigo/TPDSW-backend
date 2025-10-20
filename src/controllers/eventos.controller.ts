// src/controllers/eventos.controller.ts
import { Request, Response } from "express";
import { EventoService } from "../services/EventoService"; // <-- Importamos el servicio
import { parseIntOr } from "./utils/parser.utils";

// Helper simple (puedes ponerlo en src/utils/parser.utils.ts)
const parseIntOr = (value: any, defaultValue: number): number => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const eventoService = new EventoService();

// Obtener todos los eventos con detalle y paginación
export const getAllEventos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseIntOr(req.query.page, 1);
    const limit = parseIntOr(req.query.limit, 10);

    const result = await eventoService.getAllEventos(page, limit);

    // El servicio ya devuelve el formato de paginación
    res.status(200).json(result);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Obtener un evento por ID
export const getEventoById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const evento = await eventoService.getEventoById(Number(id));

    if (!evento) {
      res.status(404).json({ message: "Evento no encontrado" });
      return;
    }
    res.status(200).json(evento);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Crear un nuevo evento
export const createEvento = async (
  req: Request,
  res: Response
): Promise<void> => {
  // ... Implementar llamando a un futuro 'eventoService.create(req.body)'
  res.status(501).json({ message: "No implementado" });
};

// Actualizar un evento
export const updateEvento = async (
  req: Request,
  res: Response
): Promise<void> => {
  // ... Implementar llamando a un futuro 'eventoService.update(req.params.id, req.body)'
  res.status(501).json({ message: "No implementado" });
};

// Eliminar un evento
export const deleteEvento = async (
  req: Request,
  res: Response
): Promise<void> => {
  // ... Implementar llamando a un futuro 'eventoService.delete(req.params.id)'
  res.status(501).json({ message: "No implementado" });
};
