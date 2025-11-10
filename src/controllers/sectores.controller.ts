import { Request, Response } from "express";
import { orm } from "../app";
import { Sectores } from "../entities/Sectores";
import { QueryOrder, wrap } from "@mikro-orm/core";

// Obtener todos los sectores con paginación
export const getAllSectores = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const [sectores, total] = await orm.em.getRepository(Sectores).findAndCount(
      {},
      {
        orderBy: { nombreSector: QueryOrder.ASC },
        limit,
        offset,
      }
    );

    res.status(200).json({
      data: sectores,
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

//Obtener un sector por ID compuesto
export const getSectorById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id_sector, fk_id_estadio } = req.params;
  try {
    // Para claves compuestas, pasamos un objeto
    const sector = await orm.em.getRepository(Sectores).findOne({
      idSector: +id_sector,
      fkIdEstadio: +fk_id_estadio,
    });

    if (!sector) {
      res.status(404).json({ message: "Sector no encontrado" });
      return;
    }
    res.status(200).json(sector);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Crear un nuevo sector
export const createSector = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // MikroORM maneja bien el 'Omit<Sector, 'id_sector'>'
    const newSector = orm.em.create(Sectores, req.body);
    await orm.em.flush();
    res.status(201).json(newSector);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Actualizar un sector
export const updateSector = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id_sector, fk_id_estadio } = req.params;
  try {
    const sector = await orm.em.getRepository(Sectores).findOne({
      idSector: +id_sector,
      fkIdEstadio: +fk_id_estadio,
    });

    if (!sector) {
      res.status(404).json({ message: "Sector no encontrado para actualizar" });
      return;
    }

    wrap(sector).assign(req.body);
    await orm.em.flush();

    res.status(200).json({ message: "Sector actualizado correctamente" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Eliminar un sector
export const deleteSector = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id_sector, fk_id_estadio } = req.params;
  try {
    const result = await orm.em.getRepository(Sectores).nativeDelete({
      idSector: +id_sector,
      fkIdEstadio: +fk_id_estadio,
    });

    if (result === 0) {
      res.status(404).json({ message: "Sector no encontrado para eliminar" });
      return;
    }
    res.status(200).json({ message: "Sector eliminado correctamente" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};
