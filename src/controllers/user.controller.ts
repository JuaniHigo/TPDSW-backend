import { Request, Response } from "express";
import { RequestContext, wrap } from "@mikro-orm/core";
import { Usuario } from "../entities/Usuario";

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