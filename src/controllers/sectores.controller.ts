import { Request, Response } from "express";
import { RequestContext, QueryOrder, wrap } from "@mikro-orm/core";
import { Sector } from "../entities/Sector";
import { Estadio } from "../entities/Estadio";

export const getAllSectores = async (
  req: Request,
  res: Response
): Promise<void> => {
  const em = RequestContext.getEntityManager()!;
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const [sectores, total] = await em.getRepository(Sector).findAndCount(
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

// Obtener un sector por SU ID (no por clave compuesta)
export const getSectorById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const em = RequestContext.getEntityManager()!;
  const { id } = req.params;
  try {
    const sector = await em.getRepository(Sector).findOne(+id);

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
  const em = RequestContext.getEntityManager()!;
  try {
    // Para crear un sector, necesitamos el ID del estadio al que pertenece
    const { fkIdEstadio, ...sectorData } = req.body;
    if (!fkIdEstadio) {
      res
        .status(400)
        .json({ message: "El campo 'fkIdEstadio' es obligatorio." });
      return;
    }

    const newSector = em.create(Sector, {
      ...sectorData,
      fkIdEstadio: em.getReference(Estadio, fkIdEstadio),
    });

    await em.flush();
    res.status(201).json(newSector);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Actualizar un sector por SU ID
export const updateSector = async (
  req: Request,
  res: Response
): Promise<void> => {
  const em = RequestContext.getEntityManager()!;
  const { id } = req.params;
  try {
    const sector = await em.getRepository(Sector).findOne(+id);

    if (!sector) {
      res.status(404).json({ message: "Sector no encontrado para actualizar" });
      return;
    }

    // No permitimos cambiar el 'fkIdEstadio' fácilmente, solo el resto de la data
    const { fkIdEstadio, ...updateData } = req.body;
    wrap(sector).assign(updateData);
    await em.flush();

    res.status(200).json({ message: "Sector actualizado correctamente" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Eliminar un sector por SU ID
export const deleteSector = async (
  req: Request,
  res: Response
): Promise<void> => {
  const em = RequestContext.getEntityManager()!;
  const { id } = req.params;
  try {
    const result = await em.getRepository(Sector).nativeDelete(+id);

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