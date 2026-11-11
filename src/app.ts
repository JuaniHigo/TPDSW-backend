import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { Environment } from './config/env';
import { errorHandler } from './lib/http';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import clubesRoutes from './routes/clubes.routes';
import estadiosRoutes from './routes/estadios.routes';
import sectoresRoutes from './routes/sectores.routes';
import eventosRoutes from './routes/eventos.routes';
import preciosRoutes from './routes/precios.routes';
import pagoRoutes from './routes/pago.routes';
export function createApp(orm: MikroORM, env: Environment) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: new URL(env.FRONTEND_URL).origin }));
  app.use(compression());
  app.use(express.json({ limit: '100kb' }));
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.get('/ready', async (_req, res) => {
    try {
      await orm.em.getConnection().execute('SELECT 1');
      res.json({ status: 'ready' });
    } catch {
      res
        .status(503)
        .json({ code: 'NOT_READY', message: 'Base no disponible' });
    }
  });
  app.use((_req, _res, next) => {
    RequestContext.create(orm.em, next);
  });
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/clubes', clubesRoutes);
  app.use('/api/estadios', estadiosRoutes);
  app.use('/api/sectores', sectoresRoutes);
  app.use('/api/eventos', eventosRoutes);
  app.use('/api/precios', preciosRoutes);
  app.use('/api/pagos', pagoRoutes);
  app.use((_req, res) => {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Ruta no encontrada' });
  });
  app.use(errorHandler);
  return app;
}
