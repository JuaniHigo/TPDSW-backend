// src/controllers/sectores.controller.ts
import { Request, Response } from "express";
import { SectorService } from "../services/SectorService.js";
import { parseIntOr } from "../utils/parser.utils.js";
import { NotFoundError } from "../utils/errors.js";
// import { Sector } from "../entities/Sector.entity.js"; // <-- Ya no es necesario

// --- CORRECCIÓN ---
// Importamos las interfaces que el Servicio espera
import {
  CreateSectorData,
  UpdateSectorData,
} from "../services/SectorService.js";

const sectorService = new SectorService();

export const getAllSectores = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseIntOr(req.query.page, 1);
    const limit = parseIntOr(req.query.limit, 10);
    const result = await sectorService.getAllSectores(page, limit);
    res.status(200).json(result);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

export const getSectorById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id_sector, fk_id_estadio } = req.params;
  try {
    const sector = await sectorService.getSectorById(
      Number(id_sector),
      Number(fk_id_estadio)
    );
    res.status(200).json(sector);
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

export const createSector = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // --- CORRECCIÓN ---
    // Le decimos que req.body es del tipo 'CreateSectorData'
    const data: CreateSectorData = req.body;
    const newSector = await sectorService.createSector(data);
    res.status(201).json(newSector);
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

export const updateSector = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id_sector, fk_id_estadio } = req.params;
  try {
    // --- CORRECCIÓN ---
    // Le decimos que req.body es del tipo 'UpdateSectorData'
    const data: UpdateSectorData = req.body;
    const updatedSector = await sectorService.updateSector(
      Number(id_sector),
      Number(fk_id_estadio),
      data // Ahora 'data' tiene el tipo correcto
    );
    res.status(200).json({
      message: "Sector actualizado correctamente",
      sector: updatedSector,
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

export const deleteSector = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id_sector, fk_id_estadio } = req.params;
  try {
    await sectorService.deleteSector(Number(id_sector), Number(fk_id_estadio));
    res.status(200).json({ message: "Sector eliminado correctamente" });
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