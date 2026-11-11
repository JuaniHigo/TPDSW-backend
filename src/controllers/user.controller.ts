import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { LockMode } from '@mikro-orm/core';
import { Usuario } from '../entities/Usuario';
import { Entrada } from '../entities/Entrada';
import { em, handler, id, pagination, list, HttpError } from '../lib/http';
import { userDto, ticketDto } from '../lib/dto';
import { passwordSchema } from './auth.controller';
const profileSchema = z
  .object({
    nombre: z.string().trim().min(2).max(100).optional(),
    apellido: z.string().trim().min(2).max(100).optional(),
    fechaNacimiento: z.string().date().nullable().optional(),
  })
  .strict();
export const getMe = handler(async (req, res) => res.json(userDto(req.user!)));
export const updateMe = handler(async (req, res) => {
  const data = profileSchema.parse(req.body);
  await em().nativeUpdate(Usuario, { idUsuario: req.user!.idUsuario }, data);
  const u = (await em().findOne(
    Usuario,
    { idUsuario: req.user!.idUsuario },
    { refresh: true },
  ))!;
  return res.json(userDto(u));
});
export const changePassword = handler(async (req, res) => {
  const { currentPassword, password } = z
    .object({ currentPassword: z.string().max(72), password: passwordSchema })
    .parse(req.body);
  const hash = await bcrypt.hash(password, 12);
  await em().transactional(async (tx) => {
    const u = (await tx.findOne(
      Usuario,
      { idUsuario: req.user!.idUsuario },
      { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true },
    ))!;
    if (!(await bcrypt.compare(currentPassword, u.password)))
      throw new HttpError(
        400,
        'WRONG_PASSWORD',
        'La contraseña actual es incorrecta',
      );
    await tx.nativeUpdate(
      Usuario,
      { idUsuario: u.idUsuario },
      {
        password: hash,
        sessionVersion: u.sessionVersion + 1,
        resetTokenHash: null,
        resetExpiresAt: null,
      },
    );
  });
  return res.json({
    message: 'Contraseña actualizada. Iniciá sesión nuevamente',
  });
});
export const getMisEntradas = handler(async (req, res) => {
  const tickets = await em().find(
    Entrada,
    { fkIdCompra: { fkUsuario: req.user!.idUsuario } },
    {
      populate: [
        'fkIdCompra',
        'fkIdSector',
        'fkIdEvento.fkIdClubLocal',
        'fkIdEvento.fkIdClubVisitante',
      ],
      orderBy: { idEntrada: 'desc' },
    },
  );
  return res.json(tickets.map(ticketDto));
});
export const getAllUsers = handler(async (req, res) => {
  const p = pagination(req),
    [data, total] = await em().findAndCount(
      Usuario,
      {},
      { limit: p.limit, offset: p.offset, orderBy: { idUsuario: 'asc' } },
    );
  return res.json(list(data.map(userDto), total, p));
});
export const getUserById = handler(async (req, res) => {
  const u = await em().findOne(Usuario, { idUsuario: id(req.params.id) });
  if (!u) throw new HttpError(404, 'NOT_FOUND', 'Usuario no encontrado');
  return res.json(userDto(u));
});
export const updateUser = handler(async (req, res) => {
  const data = z
    .object({
      dni: z
        .string()
        .regex(/^\d{7,8}$/)
        .optional(),
      email: z.string().email().optional(),
      nombre: z.string().min(2).max(100).optional(),
      apellido: z.string().min(2).max(100).optional(),
      fechaNacimiento: z.string().date().nullable().optional(),
    })
    .strict()
    .parse(req.body);
  const u = await em().findOne(Usuario, { idUsuario: id(req.params.id) });
  if (!u) throw new HttpError(404, 'NOT_FOUND', 'Usuario no encontrado');
  await em().nativeUpdate(Usuario, { idUsuario: u.idUsuario }, data);
  return res.json(
    userDto(
      (await em().findOne(
        Usuario,
        { idUsuario: u.idUsuario },
        { refresh: true },
      ))!,
    ),
  );
});
export const deleteUser = handler(async (req, res) => {
  const count = await em().nativeDelete(Usuario, {
    idUsuario: id(req.params.id),
  });
  if (!count) throw new HttpError(404, 'NOT_FOUND', 'Usuario no encontrado');
  return res.sendStatus(204);
});
