import { Request, Response } from "express";
import { ClubService } from "../services/ClubService";
import { parseIntOr } from "../utils/parser.utils";
import { NotFoundError } from "../utils/errors";
import { Club } from "../entities/Club.entity"; // <-- Importa la Entidad

const clubService = new ClubService();

export const getAllClubes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseIntOr(req.query.page, 1);
    const limit = parseIntOr(req.query.limit, 10);

    const result = await clubService.getAllClubes(page, limit);
    res.status(200).json(result);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

export const getClubById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const club = await clubService.getClubById(Number(id));
    res.status(200).json(club);
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

export const createClub = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const newClub = await clubService.createClub(req.body as Omit<Club, "id">);
    res.status(201).json(newClub);
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

export const updateClub = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const updatedClub = await clubService.updateClub(
      Number(id),
      req.body as Partial<Club>
    );
    res
      .status(200)
      .json({ message: "Club actualizado correctamente", club: updatedClub });
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

export const deleteClub = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    await clubService.deleteClub(Number(id));
    res.status(200).json({ message: "Club eliminado correctamente" });
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
