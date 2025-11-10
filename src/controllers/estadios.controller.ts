import { Request, Response } from "express";
import { orm } from "../app";
import { Estadios } from "../entities/Estadios";
import { QueryOrder, wrap } from "@mikro-orm/core";

// Obtener todos los estadios con paginación
export const getAllEstadios = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const [estadios, total] = await orm.em.getRepository(Estadios).findAndCount(
      {},
      {
        orderBy: { nombre: QueryOrder.ASC },
        limit,
        offset,
      }
    );

    res.status(200).json({
      data: estadios,
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

// Obtener un estadio por ID
export const getEstadioById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const estadio = await orm.em.getRepository(Estadios).findOne(+id);
    if (!estadio) {
      res.status(404).json({ message: "Estadio no encontrado" });
      return;
    }
    res.status(200).json(estadio);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Crear un nuevo estadio
export const createEstadio = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const newEstadio = orm.em.create(Estadios, req.body);
    await orm.em.flush();
    res.status(201).json(newEstadio);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Actualizar un estadio
export const updateEstadio = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const estadio = await orm.em.getRepository(Estadios).findOne(+id);
    if (!estadio) {
      res
        .status(404)
        .json({ message: "Estadio no encontrado para actualizar" });
      return;
    }

    wrap(estadio).assign(req.body);
    await orm.em.flush();

    res.status(200).json({ message: "Estadio actualizado correctamente" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Eliminar un estadio
export const deleteEstadio = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await orm.em.getRepository(Estadios).nativeDelete(+id);
    if (result === 0) {
      res.status(404).json({ message: "Estadio no encontrado para eliminar" });
      return;
    }
    res.status(200).json({ message: "Estadio eliminado correctamente" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};
