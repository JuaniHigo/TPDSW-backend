import { Request, Response } from "express";
import { orm } from "../app"; // Importamos el ORM desde app.ts
import { Clubes } from "../entities/Clubes";
import { QueryOrder, wrap } from "@mikro-orm/core";

export const getAllClubes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const [clubes, total] = await orm.em.getRepository(Clubes).findAndCount(
      {},
      {
        orderBy: { nombre: QueryOrder.ASC },
        limit,
        offset,
      }
    );
    res.status(200).json({
      data: clubes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Obtener un club por ID
export const getClubById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const club = await orm.em.getRepository(Clubes).findOne(+id);
    if (!club) {
      res.status(404).json({ message: "Club no encontrado" });
      return;
    }
    res.status(200).json(club);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Crear un nuevo club
export const createClub = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Creamos la entidad
    const newClub = orm.em.create(Clubes, req.body);
    // Persistimos en la base de datos
    await orm.em.flush();

    res.status(201).json(newClub);
  } catch (error: any) {
    if (
      error.code === "ER_DUP_ENTRY" ||
      error.name === "UniqueConstraintViolationException"
    ) {
      res
        .status(409)
        .json({ message: "El nombre o prefijo del club ya existe." });
    } else {
      res
        .status(500)
        .json({ message: "Error interno del servidor", error: error.message });
    }
  }
};

// Actualizar un club
export const updateClub = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const club = await orm.em.getRepository(Clubes).findOne(+id);
    if (!club) {
      res.status(404).json({ message: "Club no encontrado para actualizar" });
      return;
    }

    // 'wrap(club).assign(data)' actualiza la entidad de forma segura
    wrap(club).assign(req.body);
    await orm.em.flush();

    res.status(200).json({ message: "Club actualizado correctamente" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Eliminar un club
export const deleteClub = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    // nativeDelete es más eficiente para borrados simples
    const result = await orm.em.getRepository(Clubes).nativeDelete(+id);
    if (result === 0) {
      res.status(404).json({ message: "Club no encontrado para eliminar" });
      return;
    }
    res.status(200).json({ message: "Club eliminado correctamente" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};
