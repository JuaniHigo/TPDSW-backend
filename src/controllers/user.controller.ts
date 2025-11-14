import { Request, Response } from "express";
import { QueryOrder, RequestContext, wrap } from "@mikro-orm/core";
import { Usuario } from "../entities/Usuario";
import { Entrada } from "../entities/Entrada";

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  const em = RequestContext.getEntityManager()!;
  try {
    const usuarios = await em.getRepository(Usuario).findAll({
      fields: [
        "idUsuario",
        "dni",
        "nombre",
        "apellido",
        "email",
        "fechaNacimiento",
      ],
    });
    res.status(200).json(usuarios);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const em = RequestContext.getEntityManager()!;
  try {
    const { id } = req.params;
    const usuario = await em.getRepository(Usuario).findOne(+id, {
      fields: [
        "idUsuario",
        "dni",
        "nombre",
        "apellido",
        "email",
        "fechaNacimiento",
      ],
    });

    if (!usuario) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }
    res.status(200).json(usuario);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const em = RequestContext.getEntityManager()!;
  try {
    const { id } = req.params;
    // Excluimos campos sensibles que no deberían actualizarse por esta vía
    const { password, rol, ...updateData } = req.body;

    const usuario = await em.getRepository(Usuario).findOne(+id);

    if (!usuario) {
      res
        .status(404)
        .json({ message: "Usuario no encontrado para actualizar" });
      return;
    }

    // Usamos wrap().assign() para actualizar la data
    wrap(usuario).assign(updateData);
    await em.flush();

    res.status(200).json({ message: "Usuario actualizado" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const em = RequestContext.getEntityManager()!;
  try {
    const { id } = req.params;
    const result = await em.getRepository(Usuario).nativeDelete(+id);

    if (result === 0) {
      res.status(404).json({ message: "Usuario no encontrado para eliminar" });
      return;
    }
    res.status(200).json({ message: "Usuario eliminado" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Nuevo controlador para obtener entradas por usuario

export const getMisEntradas = async (
  req: Request,
  res: Response
): Promise<void> => {
  const em = RequestContext.getEntityManager()!;
  const idUsuario = (req.user as Usuario).idUsuario;

  if (!idUsuario) {
    res.status(401).json({ message: "ID de usuario no autentificado" });
    return;
  }

  try {
    const entradas = await em.getRepository(Entrada).find(
      { fkIdCompra: { fkUsuario: idUsuario } },
      {
        populate: [
          "fkIdEvento",
          "fkIdEvento.fkIdClubLocal",
          "fkIdEvento.fkIdClubVisitante",
          "fkIdSector",
          "fkIdCompra",
        ],
        orderBy: { fkIdEvento: { fechaHora: QueryOrder.desc } },
      }
    );
    const entradasAplanadas = entradas.map((e) => ({
      idEntrada: e.idEntrada,
      codigoQr: e.codigoQr,
      fechaCompra: e.fkIdCompra?.fechaCompra,
      // Info del Evento
      idEvento: e.fkIdEvento.idEvento,
      fechaHora: e.fkIdEvento.fechaHora,
      torneo: e.fkIdEvento.torneo,
      // Info de Clubes
      nombreLocal: e.fkIdEvento.fkIdClubLocal.nombre,
      logoLocal: e.fkIdEvento.fkIdClubLocal.logoUrl,
      nombreVisitante: e.fkIdEvento.fkIdClubVisitante.nombre,
      logoVisitante: e.fkIdEvento.fkIdClubVisitante.logoUrl,
      // Info del Sector
      nombreSector: e.fkIdSector.nombreSector,
    }));

    res.status(200).json(entradasAplanadas);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};
