import { Request, Response } from "express";
// ⛔ ERROR: No importamos 'orm'
// ✅ CORRECTO: Importamos RequestContext
import { QueryOrder, RequestContext, wrap } from "@mikro-orm/core";
// ✅ CORRECTO: Usamos el nombre de la clase en SINGULAR
import { Estadio } from "../entities/Estadio";

// Obtener todos los estadios con paginación
export const getAllEstadios = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // ✅ OBTENEMOS 'em' DEL CONTEXTO
    const em = RequestContext.getEntityManager()!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // ✅ Usamos 'em' y 'Estadio'
    const [estadios, total] = await em.getRepository(Estadio).findAndCount(
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
    console.error("Error en getAllEstadios:", error);
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
    // ✅ OBTENEMOS 'em' DEL CONTEXTO
    const em = RequestContext.getEntityManager()!;
    // ✅ Usamos 'em' y 'Estadio'
    const estadio = await em.getRepository(Estadio).findOne(+id);

    if (!estadio) {
      res.status(404).json({ message: "Estadio no encontrado" });
      return;
    }
    res.status(200).json(estadio);
  } catch (error: any) {
    console.error(`Error en getEstadioById (id: ${id}):`, error);
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
    // ✅ OBTENEMOS 'em' DEL CONTEXTO
    const em = RequestContext.getEntityManager()!;
    // ✅ Usamos 'em' y 'Estadio'
    const newEstadio = em.create(Estadio, req.body);
    // ✅ Usamos 'em'
    await em.flush();
    res.status(201).json(newEstadio);
  } catch (error: any) {
    console.error("Error en createEstadio:", error);
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
    // ✅ OBTENEMOS 'em' DEL CONTEXTO
    const em = RequestContext.getEntityManager()!;
    // ✅ Usamos 'em' y 'Estadio'
    const estadio = await em.getRepository(Estadio).findOne(+id);

    if (!estadio) {
      res
        .status(404)
        .json({ message: "Estadio no encontrado para actualizar" });
      return;
    }

    wrap(estadio).assign(req.body);
    // ✅ Usamos 'em'
    await em.flush();

    res.status(200).json({ message: "Estadio actualizado correctamente" });
  } catch (error: any) {
    console.error(`Error en updateEstadio (id: ${id}):`, error);
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
    // ✅ OBTENEMOS 'em' DEL CONTEXTO
    const em = RequestContext.getEntityManager()!;
    // ✅ Usamos 'em' y 'Estadio'
    const result = await em.getRepository(Estadio).nativeDelete(+id);

    if (result === 0) {
      res.status(404).json({ message: "Estadio no encontrado para eliminar" });
      return;
    }
    res.status(200).json({ message: "Estadio eliminado correctamente" });
  } catch (error: any) {
    console.error(`Error en deleteEstadio (id: ${id}):`, error);
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};