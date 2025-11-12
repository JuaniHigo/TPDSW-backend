import { Request, Response } from "express";
// ⛔ ERROR: No importamos 'orm'
// ✅ CORRECTO: Importamos RequestContext
import { QueryOrder, RequestContext, wrap } from "@mikro-orm/core";
// ✅ CORRECTO: Usamos el nombre de la clase en SINGULAR
import { Evento } from "../entities/Evento";

// Obtener todos los eventos con detalle y paginación
export const getAllEventos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // ✅ OBTENEMOS 'em' DEL CONTEXTO
    const em = RequestContext.getEntityManager()!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Usamos 'populate' para cargar las relaciones (como un JOIN)
    // ✅ Usamos 'em' y 'Evento'
    const [eventos, total] = await em.getRepository(Evento).findAndCount(
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
    // ❗ NOTA: Asegúrate que los nombres de las propiedades (ej. 'fkIdClubLocal')
    // coincidan con los de tu entidad 'Evento' (singular)
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
    console.error("Error en getAllEventos:", error);
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
    // ✅ OBTENEMOS 'em' DEL CONTEXTO
    const em = RequestContext.getEntityManager()!;
    // ✅ Usamos 'em' y 'Evento'
    const evento = await em.getRepository(Evento).findOne(+id, {
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
    console.error(`Error en getEventoById (id: ${id}):`, error);
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
    // ✅ OBTENEMOS 'em' DEL CONTEXTO
    const em = RequestContext.getEntityManager()!;
    // ✅ Usamos 'em' y 'Evento'
    const newEvento = em.create(Evento, req.body);
    // ✅ Usamos 'em'
    await em.flush();
    res.status(201).json(newEvento);
  } catch (error: any) {
    console.error("Error en createEvento:", error);
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
    // ✅ OBTENEMOS 'em' DEL CONTEXTO
    const em = RequestContext.getEntityManager()!;
    // ✅ Usamos 'em' y 'Evento'
    const evento = await em.getRepository(Evento).findOne(+id);

    if (!evento) {
      res.status(404).json({ message: "Evento no encontrado para actualizar" });
      return;
    }

    wrap(evento).assign(req.body);
    // ✅ Usamos 'em'
    await em.flush();

    res.status(200).json({ message: "Evento actualizado correctamente" });
  } catch (error: any) {
    console.error(`Error en updateEvento (id: ${id}):`, error);
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
    // ✅ OBTENEMOS 'em' DEL CONTEXTO
    const em = RequestContext.getEntityManager()!;
    // ✅ Usamos 'em' y 'Evento'
    const result = await em.getRepository(Evento).nativeDelete(+id);

    if (result === 0) {
      res.status(404).json({ message: "Evento no encontrado para eliminar" });
      return;
    }
    res.status(200).json({ message: "Evento eliminado correctamente" });
  } catch (error: any) {
    console.error(`Error en deleteEvento (id: ${id}):`, error);
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};