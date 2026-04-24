import { z } from 'zod';

export const createSectorSchema = z.object({
    body: z.object({
        fkIdEstadio: z.number({ message: "El campo 'fkIdEstadio' es obligatorio" })
            .int().positive(),
        nombreSector: z.string({ message: "El nombre del sector es obligatorio" })
            .min(1, { message: "El nombre del sector es obligatorio" })
            .max(100, { message: "El nombre del sector no puede exceder 100 caracteres" }),
        capacidad: z.number()
            .int().positive({ message: "La capacidad debe ser un número positivo" })
            .optional(),
    })
});

export const updateSectorSchema = z.object({
    body: z.object({
        nombreSector: z.string()
            .min(1, { message: "El nombre del sector es obligatorio" })
            .max(100, { message: "El nombre del sector no puede exceder 100 caracteres" })
            .optional(),
        capacidad: z.number()
            .int().positive({ message: "La capacidad debe ser un número positivo" })
            .optional(),
    })
});
