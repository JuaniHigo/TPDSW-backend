// src/controllers/user.controller.ts
import { Request, Response } from "express";
import { orm } from "../app"; // Importamos el ORM desde app.ts
import { Usuarios } from "../entities/Usuarios"; // Importamos la NUEVA entidad

// Ya no importamos 'pool' ni la interfaz 'User'

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const usuarios = await orm.em.getRepository(Usuarios).findAll({
      // Es buena práctica seleccionar solo los campos que necesitas
      // y excluir la contraseña
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
  try {
    const { id } = req.params;
    const usuario = await orm.em.getRepository(Usuarios).findOne(+id, {
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
  try {
    const { id } = req.params;
    // Tu lógica anterior solo actualizaba nombre y apellido
    const { nombre, apellido } = req.body;

    // 1. Buscamos al usuario
    const usuario = await orm.em.getRepository(Usuarios).findOne(+id);

    if (!usuario) {
      res
        .status(404)
        .json({ message: "Usuario no encontrado para actualizar" });
      return;
    }

    // 2. Modificamos la entidad (MikroORM rastrea los cambios)
    if (nombre) {
      usuario.nombre = nombre;
    }
    if (apellido) {
      usuario.apellido = apellido;
    }

    // 3. Guardamos los cambios en la base de datos
    await orm.em.flush();

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
  try {
    const { id } = req.params;

    // 'nativeDelete' es más eficiente, es como un 'DELETE FROM ...' directo
    const result = await orm.em.getRepository(Usuarios).nativeDelete(+id);

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
