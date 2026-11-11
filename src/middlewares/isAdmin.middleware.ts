import { RequestHandler } from 'express';
import { HttpError } from '../lib/http';
export const isAdmin: RequestHandler = (req, _res, next) =>
  next(
    req.user?.rol === 'admin'
      ? undefined
      : new HttpError(403, 'FORBIDDEN', 'Se requiere rol de administrador'),
  );
