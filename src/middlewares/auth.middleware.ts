import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { Usuario } from '../entities/Usuario';
import { em, HttpError } from '../lib/http';
import { getEnv } from '../config/env';
declare global {
  namespace Express {
    interface Request {
      user?: Usuario;
    }
  }
}
export const isAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token)
      throw new HttpError(401, 'UNAUTHORIZED', 'Iniciá sesión para continuar');
    let payload: jwt.JwtPayload;
    try {
      const decoded = jwt.verify(token, getEnv().JWT_SECRET, {
        algorithms: ['HS256'],
      });
      if (typeof decoded === 'string') throw new Error();
      payload = decoded;
    } catch {
      throw new HttpError(401, 'UNAUTHORIZED', 'La sesión venció');
    }
    const user = Number.isInteger(payload.idUsuario)
      ? await em().findOne(Usuario, { idUsuario: payload.idUsuario })
      : null;
    if (!user || user.sessionVersion !== payload.sessionVersion)
      throw new HttpError(401, 'UNAUTHORIZED', 'La sesión venció');
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
