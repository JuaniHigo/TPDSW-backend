import { z } from 'zod';

export const setPrecioSchema = z.object({
    body: z.object({
        fkIdEvento: z.number({ message: "El campo 'fkIdEvento' es obligatorio" })
            .int().positive(),
        fkIdSector: z.number({ message: "El campo 'fkIdSector' es obligatorio" })
            .int().positive(),
        precio: z.number({ message: "El precio es obligatorio" })
            .positive({ message: "El precio debe ser un número positivo" }),
    })
});
