import { Request, Response } from "express";
// ⛔ ERROR: No importamos 'orm'
// ✅ CORRECTO: Importamos RequestContext
import { QueryOrder, RequestContext, wrap } from "@mikro-orm/core";
// ✅ CORRECTO: Usamos el nombre de la clase en SINGULAR
import { Club } from "../entities/Club";

export const getAllClubes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // ✅ OBTENEMOS 'em' DEL CONTEXTO
    const em = RequestContext.getEntityManager()!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // ✅ Usamos 'em' y 'Club'
    const [clubes, total] = await em.getRepository(Club).findAndCount(
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
    console.error("Error en getAllClubes:", error); // Loguear error
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
    // ✅ OBTENEMOS 'em' DEL CONTEXTO
    const em = RequestContext.getEntityManager()!;
    // ✅ Usamos 'em' y 'Club'
    const club = await em.getRepository(Club).findOne(+id);

    if (!club) {
      res.status(404).json({ message: "Club no encontrado" });
      return;
    }
    res.status(200).json(club);
  } catch (error: any) {
    console.error(`Error en getClubById (id: ${id}):`, error);
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
    // ✅ OBTENEMOS 'em' DEL CONTEXTO
    const em = RequestContext.getEntityManager()!;
    // ✅ Usamos 'em' y 'Club'
    const newClub = em.create(Club, req.body);
    // ✅ Usamos 'em'
    await em.flush();

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
      console.error("Error en createClub:", error);
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
    // ✅ OBTENEMOS 'em' DEL CONTEXTO
    const em = RequestContext.getEntityManager()!;
    // ✅ Usamos 'em' y 'Club'
    const club = await em.getRepository(Club).findOne(+id);

    if (!club) {
      res.status(404).json({ message: "Club no encontrado para actualizar" });
      return;
    }

    // 'wrap(club).assign(data)' actualiza la entidad de forma segura
    wrap(club).assign(req.body);
    // ✅ Usamos 'em'
    await em.flush();

    res.status(200).json({ message: "Club actualizado correctamente" });
  } catch (error: any) {
    console.error(`Error en updateClub (id: ${id}):`, error);
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
    // ✅ OBTENEMOS 'em' DEL CONTEXTO
    const em = RequestContext.getEntityManager()!;
    // ✅ Usamos 'em' y 'Club'
    // nativeDelete es más eficiente para borrados simples
    const result = await em.getRepository(Club).nativeDelete(+id);

    if (result === 0) {
      res.status(404).json({ message: "Club no encontrado para eliminar" });
      return;
    }
    res.status(200).json({ message: "Club eliminado correctamente" });
  } catch (error: any) {
    console.error(`Error en deleteClub (id: ${id}):`, error);
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};