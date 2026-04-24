import { z } from 'zod';

export const createEventoSchema = z.object({
    body: z.object({
        fkIdClubLocal: z.number({ message: "El club local es obligatorio" })
            .int().positive(),
        fkIdClubVisitante: z.number({ message: "El club visitante es obligatorio" })
            .int().positive(),
        fkIdEstadio: z.number({ message: "El estadio es obligatorio" })
            .int().positive(),
        fechaHora: z.string({ message: "La fecha y hora son obligatorias" })
            .datetime({ message: "El formato de fecha/hora no es válido (usar ISO 8601)" }),
        torneo: z.string().max(100).optional(),
        estado: z.enum(["Programado", "En Venta", "Finalizado", "Cancelado"]).optional(),
        soloPublicoLocal: z.boolean().optional(),
    })
});

export const updateEventoSchema = z.object({
    body: z.object({
        fkIdClubLocal: z.number().int().positive().optional(),
        fkIdClubVisitante: z.number().int().positive().optional(),
        fkIdEstadio: z.number().int().positive().optional(),
        fechaHora: z.string()
            .datetime({ message: "El formato de fecha/hora no es válido (usar ISO 8601)" })
            .optional(),
        torneo: z.string().max(100).optional(),
        estado: z.enum(["Programado", "En Venta", "Finalizado", "Cancelado"]).optional(),
        soloPublicoLocal: z.boolean().optional(),
    })
});
