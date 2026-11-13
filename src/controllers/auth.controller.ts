import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'node:crypto';
import { LockMode } from '@mikro-orm/core';
import { z } from 'zod';
import { Usuario } from '../entities/Usuario';
import { em, handler, HttpError } from '../lib/http';
import { userDto } from '../lib/dto';
import { getEnv } from '../config/env';
import { mailer } from '../services/mail';
export const passwordSchema = z.string().min(8).max(72);
const dummyPasswordHash =
  '$2b$12$B4vsbQDi7/RH.MmBwHy6OupVP677zyXzIivs35xjoSFfCgAniFzxO';
export const tokenHash = (token: string) =>
  createHash('sha256').update(token).digest('hex');
export const register = handler(async (req, res) => {
  const data = z
    .object({
      dni: z.string().regex(/^\d{7,8}$/),
      nombre: z.string().trim().min(2).max(100),
      apellido: z.string().trim().min(2).max(100),
      email: z
        .string()
        .email()
        .transform((s) => s.toLowerCase()),
      password: passwordSchema,
      fechaNacimiento: z.string().date().optional(),
    })
    .parse(req.body);
  const user = em().create(Usuario, {
    ...data,
    password: await bcrypt.hash(data.password, 12),
    rol: 'user',
  });
  await em().persistAndFlush(user);
  return res.status(201).json({ message: 'Usuario registrado correctamente' });
});
export const login = handler(async (req, res) => {
  const { email, password } = z
    .object({
      email: z
        .string()
        .email()
        .transform((s) => s.toLowerCase()),
      password: z.string().min(1).max(72),
    })
    .parse(req.body);
  const user = await em().findOne(Usuario, { email });
  const validPassword = await bcrypt.compare(
    password,
    user?.password ?? dummyPasswordHash,
  );
  if (!user || !validPassword)
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Credenciales inválidas');
  const token = jwt.sign(
    { idUsuario: user.idUsuario, sessionVersion: user.sessionVersion },
    getEnv().JWT_SECRET,
    { expiresIn: '1h', algorithm: 'HS256' },
  );
  return res.json({ token, user: userDto(user) });
});
export const forgotPassword = handler(async (req, res) => {
  const { email } = z
    .object({
      email: z
        .string()
        .email()
        .transform((s) => s.toLowerCase()),
    })
    .parse(req.body);
  const user = await em().findOne(Usuario, { email });
  if (user) {
    const token = randomBytes(32).toString('hex');
    user.resetTokenHash = tokenHash(token);
    user.resetExpiresAt = new Date(Date.now() + 30 * 60000);
    await em().flush();
    try {
      await mailer.sendReset(email, token);
    } catch {
      // Never expose SMTP failures or account existence to the caller.
      await em().nativeUpdate(
        Usuario,
        { idUsuario: user.idUsuario, resetTokenHash: tokenHash(token) },
        { resetTokenHash: null, resetExpiresAt: null },
      );
      console.error('SMTP_RESET_DELIVERY_FAILED');
    }
  }
  return res.json({
    message:
      'Si el correo está registrado, recibirás un enlace de recuperación',
  });
});
export const resetPassword = handler(async (req, res) => {
  const token = z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .parse(req.params.token);
  const { password } = z.object({ password: passwordSchema }).parse(req.body),
    hash = await bcrypt.hash(password, 12);
  await em().transactional(async (tx) => {
    const user = await tx.findOne(
      Usuario,
      { resetTokenHash: tokenHash(token) },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    if (
      !user ||
      !user.resetExpiresAt ||
      user.resetExpiresAt.getTime() <= Date.now()
    )
      throw new HttpError(
        400,
        'INVALID_RESET_TOKEN',
        'El enlace es inválido o venció',
      );
    user.password = hash;
    user.sessionVersion++;
    user.resetTokenHash = undefined;
    user.resetExpiresAt = undefined;
    await tx.nativeUpdate(
      Usuario,
      { idUsuario: user.idUsuario },
      {
        password: hash,
        sessionVersion: user.sessionVersion,
        resetTokenHash: null,
        resetExpiresAt: null,
      },
    );
  });
  return res.json({
    message: 'Contraseña actualizada. Iniciá sesión nuevamente',
  });
});
