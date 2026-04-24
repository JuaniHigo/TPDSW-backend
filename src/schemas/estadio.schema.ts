import { z } from 'zod';

export const createEstadioSchema = z.object({
    body: z.object({
        nombre: z.string()
            .min(2, { message: "El nombre del estadio debe tener al menos 2 caracteres" })
            .max(100, { message: "El nombre del estadio no puede exceder 100 caracteres" }),
        calle: z.string().max(150).optional(),
        numero: z.string().max(10).optional(),
        ciudad: z.string().max(100).optional(),
    })
});

export const updateEstadioSchema = z.object({
    body: z.object({
        nombre: z.string()
            .min(2, { message: "El nombre del estadio debe tener al menos 2 caracteres" })
            .max(100, { message: "El nombre del estadio no puede exceder 100 caracteres" })
            .optional(),
        calle: z.string().max(150).optional(),
        numero: z.string().max(10).optional(),
        ciudad: z.string().max(100).optional(),
    })
});
