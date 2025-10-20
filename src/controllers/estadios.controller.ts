// src/controllers/estadios.controller.ts
import { Request, Response } from "express";
import { EstadioService } from "../services/EstadioService";
import { parseIntOr } from "../utils/parser.utils";
import { NotFoundError } from "../utils/errors";
import { Estadio } from "../entities/Estadio.entity"; // <-- Importa la Entidad

const estadioService = new EstadioService();

export const getAllEstadios = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseIntOr(req.query.page, 1);
    const limit = parseIntOr(req.query.limit, 10);

    const result = await estadioService.getAllEstadios(page, limit);
    res.status(200).json(result);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

export const getEstadioById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const estadio = await estadioService.getEstadioById(Number(id));
    res.status(200).json(estadio);
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res
        .status(500)
        .json({ message: "Error interno del servidor", error: error.message });
    }
  }
};

export const createEstadio = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const newEstadio = await estadioService.createEstadio(
      req.body as Omit<Estadio, "id">
    );
    res.status(201).json(newEstadio);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

export const updateEstadio = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const updatedEstadio = await estadioService.updateEstadio(
      Number(id),
      req.body as Partial<Estadio>
    );
    res
      .status(200)
      .json({
        message: "Estadio actualizado correctamente",
        estadio: updatedEstadio,
      });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res
        .status(500)
        .json({ message: "Error interno del servidor", error: error.message });
    }
  }
};

export const deleteEstadio = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    await estadioService.deleteEstadio(Number(id));
    res.status(200).json({ message: "Estadio eliminado correctamente" });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res
        .status(500)
        .json({ message: "Error interno del servidor", error: error.message });
    }
  }
};
