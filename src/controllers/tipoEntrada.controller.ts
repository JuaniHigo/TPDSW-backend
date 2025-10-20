// src/controllers/tipoEntrada.controller.ts
import { Request, Response } from "express";
import { TipoEntradaService } from "../services/TipoEntradaService";
import { NotFoundError } from "../utils/errors";
import { TipoEntrada } from "../entities/TipoEntrada.entity"; // <-- Importa la Entidad

const tipoEntradaService = new TipoEntradaService();

export const getTipoEntradas = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tipos = await tipoEntradaService.getAllTipoEntradas();
    res.status(200).json(tipos);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

export const getTipoEntradaByID = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const tipo = await tipoEntradaService.getTipoEntradaById(Number(id));
    res.status(200).json(tipo);
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

export const createTipoEntrada = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const newTipo = await tipoEntradaService.createTipoEntrada(
      req.body as Omit<TipoEntrada, "id">
    );
    res.status(201).json(newTipo);
  } catch (error: any) {
    if (error.message.includes("ya existe")) {
      res.status(409).json({ message: error.message });
    } else {
      res
        .status(500)
        .json({ message: "Error interno del servidor", error: error.message });
    }
  }
};

export const updateTipoEntrada = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const updatedTipo = await tipoEntradaService.updateTipoEntrada(
      Number(id),
      req.body as Partial<TipoEntrada>
    );
    res.status(200).json(updatedTipo);
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

export const deleteTipoEntrada = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    await tipoEntradaService.deleteTipoEntrada(Number(id));
    res
      .status(200)
      .json({ message: "Tipo de entrada eliminado correctamente" });
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
