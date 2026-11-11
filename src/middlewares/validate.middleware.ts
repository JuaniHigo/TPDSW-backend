import { RequestHandler } from 'express';
import { z } from 'zod';
export const validate =
  (schema: z.ZodType): RequestHandler =>
  (req, res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as { body?: unknown };
      if (parsed.body !== undefined) req.body = parsed.body;
      // Express 5 query is a getter; never assign to it.
      res.locals.validated = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };
