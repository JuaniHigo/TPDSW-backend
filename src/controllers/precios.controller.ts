import { Request, Response } from "express";
import { orm } from "../app";
import { PreciosEventoSector } from "../entities/PreciosEventoSector";
import { wrap } from "@mikro-orm/core";

// Obtener precios por evento
export const getPreciosPorEvento = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id_evento } = req.params;
  try {
    const precios = await orm.em
      .getRepository(PreciosEventoSector)
      .find({ fk_id_evento: +id_evento }, { populate: ["fk_id_sector"] });
    res.status(200).json(precios);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Asignar o actualizar un precio
export const setPrecio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fk_id_evento, fk_id_sector, precio } = req.body;

    const repo = orm.em.getRepository(PreciosEventoSector);

    let precioExistente = await repo.findOne({ fk_id_evento, fk_id_sector });

    if (precioExistente) {
      // Actualizar
      wrap(precioExistente).assign({ precio });
    } else {
      // Crear
      precioExistente = repo.create({ fk_id_evento, fk_id_sector, precio });
      orm.em.persist(precioExistente);
    }

    await orm.em.flush();
    res.status(201).json(precioExistente);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Eliminar un precio
export const deletePrecio = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id_evento, id_sector } = req.params;
  try {
    const result = await orm.em
      .getRepository(PreciosEventoSector)
      .nativeDelete({
        fk_id_evento: +id_evento,
        fk_id_sector: +id_sector,
      });

    if (result === 0) {
      res.status(404).json({ message: "Precio no encontrado para eliminar" });
      return;
    }
    res.status(200).json({ message: "Precio eliminado" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};
