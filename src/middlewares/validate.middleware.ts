import { Request, Response, NextFunction } from 'express';
import { ZodObject } from 'zod';

export const validate = (schema: ZodObject<any>) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            // Reemplazamos req.body con los datos limpios (sin campos extra)
            req.body = parsed.body;
            if (parsed.query) req.query = parsed.query as any;
            if (parsed.params) req.params = parsed.params as any;
            return next();
        } catch (error: any) {
            const errors = error.flatten?.()?.fieldErrors ?? error.message;
            return res.status(400).json({
                message: "Error de validación",
                errors: errors
            });
        }
    };