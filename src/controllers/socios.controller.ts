import { Request, Response } from "express";
import { orm } from "../app";
import { Socios } from "../entities/Socios";
import { Clubes } from "../entities/Clubes";
import { QueryOrder, wrap } from "@mikro-orm/core";

// Crear nuevo socio (con transacción)
export const createSocio = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { fk_id_usuario, fk_id_club } = req.body;

  try {
    // Envolvemos toda la lógica en una transacción
    const nro_socio_generado = await orm.em.transactional(async (em) => {
      // 1. Obtenemos el prefijo del club
      const club = await em.findOne(Clubes, { idClub: fk_id_club });
      if (!club) {
        throw new Error("El club especificado no existe.");
      }
      const prefijo = (club as any).prefijo; // Asumiendo que prefijo existe

      // 2. Contamos cuántos socios tiene ese club
      const totalSocios = await em.getRepository(Socios).count({ fk_id_club });
      const nuevoNumero = totalSocios + 1;

      // 3. Generamos el nuevo número de socio
      const nro_socio = `${prefijo}-${nuevoNumero}`;

      // 4. Obtenemos la fecha actual
      const fecha_asociacion = new Date();

      // 5. Creamos la entidad
      const newSocio = em.create(Socios, {
        fk_id_usuario,
        fk_id_club,
        nro_socio,
        fecha_asociacion,
      });

      // em.flush() se llama automáticamente al final de la transacción

      return nro_socio; // Devolvemos el número generado
    });

    res
      .status(201)
      .json({
        message: "Socio creado correctamente",
        nro_socio: nro_socio_generado,
      });
  } catch (error: any) {
    if (
      error.code === "ER_DUP_ENTRY" ||
      error.name === "UniqueConstraintViolationException"
    ) {
      res.status(409).json({ message: "El usuario ya es socio de ese club." });
    } else if (error.message === "El club especificado no existe.") {
      res.status(404).json({ message: error.message });
    } else {
      res
        .status(500)
        .json({ message: "Error en el servidor", error: error.message });
    }
  }
};

// Obtener todos los socios
export const getAllSocios = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const [socios, total] = await orm.em.getRepository(Socios).findAndCount(
      {},
      {
        limit,
        offset,
      }
    );

    res.status(200).json({
      data: socios,
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

// Obtener un socio específico
export const getSocioById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id_usuario, id_club } = req.params;
  try {
    const socio = await orm.em.getRepository(Socios).findOne({
      fk_id_usuario: +id_usuario,
      fk_id_club: +id_club,
    });

    if (!socio) {
      res.status(404).json({ message: "Socio no encontrado" });
      return;
    }
    res.status(200).json(socio);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Actualizar socio
export const updateSocio = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id_usuario, id_club } = req.params;

  // No permitimos cambiar las claves primarias
  const { fk_id_usuario, fk_id_club, ...updateData } = req.body;

  if (Object.keys(updateData).length === 0) {
    res
      .status(400)
      .json({ message: "No se proporcionaron datos para actualizar" });
    return;
  }

  try {
    const socio = await orm.em.getRepository(Socios).findOne({
      fk_id_usuario: +id_usuario,
      fk_id_club: +id_club,
    });

    if (!socio) {
      res.status(404).json({ message: "Socio no encontrado para actualizar" });
      return;
    }

    wrap(socio).assign(updateData);
    await orm.em.flush();

    res.status(200).json({ message: "Socio actualizado correctamente" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Eliminar socio
export const deleteSocio = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id_usuario, id_club } = req.params;
  try {
    const result = await orm.em.getRepository(Socios).nativeDelete({
      fk_id_usuario: +id_usuario,
      fk_id_club: +id_club,
    });

    if (result === 0) {
      res.status(404).json({ message: "Socio no encontrado para eliminar" });
      return;
    }
    res.status(200).json({ message: "Socio eliminado correctamente" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};
