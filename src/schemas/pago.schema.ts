import { z } from 'zod';

export const pagoSchema = z.object({
    body: z.object({
        eventoId: z.number({ message: "El evento es obligatorio" })
            .int().positive(),
        sectorId: z.number({ message: "El sector es obligatorio" })
            .int().positive(),
        quantity: z.number({ message: "La cantidad es obligatoria" })
            .int().positive({ message: "La cantidad debe ser un número entero positivo" }),
    })
});
