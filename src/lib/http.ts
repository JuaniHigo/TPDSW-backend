import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import {
  RequestContext,
  UniqueConstraintViolationException,
  ForeignKeyConstraintViolationException,
} from '@mikro-orm/core';
import { z } from 'zod';
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public errors?: Record<string, unknown>,
  ) {
    super(message);
  }
}
export function em() {
  return RequestContext.getEntityManager()!;
}
export function id(value: unknown): number {
  return z.coerce.number().int().positive().parse(value);
}
export function pagination(req: Request) {
  const { page, limit } = z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(10),
    })
    .parse(req.query);
  return { page, limit, offset: (page - 1) * limit };
}
export function list<T>(
  data: T[],
  total: number,
  p: { page: number; limit: number },
) {
  return {
    data,
    pagination: {
      total,
      page: p.page,
      limit: p.limit,
      totalPages: Math.ceil(total / p.limit),
    },
  };
}
export const handler =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  _next,
) => {
  if (error instanceof z.ZodError) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Datos inválidos',
      errors: error.flatten(),
    });
    return;
  }
  if (error instanceof HttpError) {
    res
      .status(error.status)
      .json({ code: error.code, message: error.message, errors: error.errors });
    return;
  }
  if (
    error instanceof UniqueConstraintViolationException ||
    error instanceof ForeignKeyConstraintViolationException
  ) {
    res.status(409).json({
      code: 'CONFLICT',
      message: 'La operación entra en conflicto con datos existentes',
    });
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ code: 'INVALID_JSON', message: 'JSON inválido' });
    return;
  }
  console.error(
    'Error interno',
    error instanceof Error ? error.name : 'UnknownError',
  );
  res
    .status(500)
    .json({ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' });
};
