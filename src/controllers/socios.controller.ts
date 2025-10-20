// src/controllers/socios.controller.ts
import { Request, Response } from "express";
import { SocioService } from "../services/SocioService";
import { parseIntOr } from "../utils/parser.utils";
import { NotFoundError } from "../utils/errors";
import { Socio } from "../entities/Socio.entity"; // <-- Importa la Entidad

const socioService = new SocioService();

export const createSocio = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { fk_id_usuario, fk_id_club } = req.body;
  try {
    const newSocio = await socioService.createSocio(
      Number(fk_id_usuario),
      Number(fk_id_club)
    );
    res
      .status(201)
      .json({ message: "Socio creado correctamente", socio: newSocio });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else if (error.message.includes("ya es socio")) {
      res.status(409).json({ message: error.message });
    } else {
      res
        .status(500)
        .json({ message: "Error en el servidor", error: error.message });
    }
  }
};

export const getAllSocios = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseIntOr(req.query.page, 1);
    const limit = parseIntOr(req.query.limit, 10);
    const result = await socioService.getAllSocios(page, limit);
    res.status(200).json(result);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

export const getSocioById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id_usuario, id_club } = req.params;
  try {
    const socio = await socioService.getSocioById(
      Number(id_usuario),
      Number(id_club)
    );
    res.status(200).json(socio);
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

export const updateSocio = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id_usuario, id_club } = req.params;
  try {
    const updatedSocio = await socioService.updateSocio(
      Number(id_usuario),
      Number(id_club),
      req.body as Partial<Socio>
    );
    res
      .status(200)
      .json({
        message: "Socio actualizado correctamente",
        socio: updatedSocio,
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

export const deleteSocio = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id_usuario, id_club } = req.params;
  try {
    await socioService.deleteSocio(Number(id_usuario), Number(id_club));
    res.status(200).json({ message: "Socio eliminado correctamente" });
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
