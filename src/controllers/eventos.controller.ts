import { Request, Response } from "express";
import { orm } from "../app";
import { Eventos } from "../entities/Eventos";
import { QueryOrder, wrap } from "@mikro-orm/core";

// Obtener todos los eventos con detalle y paginación
export const getAllEventos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Usamos 'populate' para cargar las relaciones (como un JOIN)
    const [eventos, total] = await orm.em.getRepository(Eventos).findAndCount(
      {},
      {
        populate: ["fkIdClubLocal", "fkIdClubVisitante", "fkIdEstadio"],
        orderBy: { fechaHora: QueryOrder.DESC },
        limit,
        offset,
      }
    );

    // MikroORM devuelve las entidades anidadas.
    // Si quieres aplanar la respuesta como antes, puedes usar .map()
    const dataAplanada = eventos.map((e) => ({
      id_evento: e.idEvento,
      fecha_hora: e.fechaHora,
      torneo: e.torneo,
      estado: e.estado,
      nombre_local: e.fkIdClubLocal?.nombre,
      logo_local: e.fkIdClubLocal?.logoUrl,
      nombre_visitante: e.fkIdClubVisitante?.nombre,
      logo_visitante: e.fkIdClubVisitante?.logoUrl,
      nombre_estadio: e.fkIdEstadio?.nombre,
    }));

    res.status(200).json({
      data: dataAplanada,
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

// Obtener un evento por ID
export const getEventoById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const evento = await orm.em.getRepository(Eventos).findOne(+id, {
      populate: ["fkIdClubLocal", "fkIdClubVisitante", "fkIdEstadio"],
    });

    if (!evento) {
      res.status(404).json({ message: "Evento no encontrado" });
      return;
    }

    // Aplanamos la respuesta aquí también
    const plain = wrap(evento).toJSON();
    const dataAplanada = {
      ...plain,
      nombre_local: plain.fkIdClubLocal?.nombre,
      logo_local: plain.fkIdClubLocal?.logoUrl,
      nombre_visitante: plain.fkIdClubVisitante?.nombre,
      logo_visitante: plain.fkIdClubVisitante?.logoUrl,
      nombre_estadio: plain.fkIdEstadio?.nombre,
    };
    res.status(200).json(dataAplanada);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Crear un nuevo evento
export const createEvento = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const newEvento = orm.em.create(Eventos, req.body);
    await orm.em.flush();
    res.status(201).json(newEvento);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Actualizar un evento
export const updateEvento = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const evento = await orm.em.getRepository(Eventos).findOne(+id);
    if (!evento) {
      res.status(404).json({ message: "Evento no encontrado para actualizar" });
      return;
    }

    wrap(evento).assign(req.body);
    await orm.em.flush();

    res.status(200).json({ message: "Evento actualizado correctamente" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Eliminar un evento
export const deleteEvento = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await orm.em.getRepository(Eventos).nativeDelete(+id);
    if (result === 0) {
      res.status(404).json({ message: "Evento no encontrado para eliminar" });
      return;
    }
    res.status(200).json({ message: "Evento eliminado correctamente" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};
