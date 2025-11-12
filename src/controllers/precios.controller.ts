import { Request, Response } from "express";
import { RequestContext, wrap } from "@mikro-orm/core";
import { PrecioEventoSector } from "../entities/PrecioEventoSector";
import { Evento } from "../entities/Evento";
import { Sector } from "../entities/Sector";

// Obtener precios por evento
export const getPreciosPorEvento = async (
  req: Request,
  res: Response
): Promise<void> => {
  const em = RequestContext.getEntityManager()!;
  // Usamos camelCase (idEvento)
  const { idEvento } = req.params;
  try {
    // Usamos camelCase (fkIdEvento)
    const precios = await em.getRepository(PrecioEventoSector).find(
      { fkIdEvento: +idEvento },
      { populate: ["fkIdSector"] } // Populamos la relación del sector
    );
    res.status(200).json(precios);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Asignar o actualizar un precio
export const setPrecio = async (req: Request, res: Response): Promise<void> => {
  const em = RequestContext.getEntityManager()!;
  try {
    // Usamos camelCase (fkIdEvento, fkIdSector)
    const { fkIdEvento, fkIdSector, precio } = req.body;

    if (!fkIdEvento || !fkIdSector || !precio) {
      // ✅ CORRECCIÓN 1: No hacemos 'return' del 'res.json()'.
      res
        .status(400)
        .json({ message: "Faltan 'fkIdEvento', 'fkIdSector' o 'precio'." });
      return; // <-- Añadimos un 'return;' vacío aquí para salir de la función.
    }

    const repo = em.getRepository(PrecioEventoSector);

    let precioExistente = await repo.findOne({ fkIdEvento, fkIdSector });

    if (precioExistente) {
      // Actualizar
      wrap(precioExistente).assign({ precio });
    } else {
      // Crear (usando getReference para seguridad)
      precioExistente = repo.create({
        fkIdEvento: em.getReference(Evento, fkIdEvento),
        fkIdSector: em.getReference(Sector, fkIdSector),
        precio,
      });
      em.persist(precioExistente);
    }

    await em.flush();
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
  const em = RequestContext.getEntityManager()!;
  // Usamos camelCase
  const { idEvento, idSector } = req.params;
  try {
    const result = await em.getRepository(PrecioEventoSector).nativeDelete({
      fkIdEvento: +idEvento,
      fkIdSector: +idSector,
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