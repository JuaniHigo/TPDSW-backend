import { z } from 'zod';

export const createClubSchema = z.object({
  body: z.object({
    nombre: z
      .string()
      .min(2, {
        message: 'El nombre del club debe tener al menos 2 caracteres',
      })
      .max(100, {
        message: 'El nombre del club no puede exceder 100 caracteres',
      }),
    logoUrl: z
      .union([z.string().url(), z.literal(''), z.null()])
      .optional()
      .transform((v) => v || null),
  }),
});

export const updateClubSchema = z.object({
  body: z.object({
    nombre: z
      .string()
      .min(2, {
        message: 'El nombre del club debe tener al menos 2 caracteres',
      })
      .max(100, {
        message: 'El nombre del club no puede exceder 100 caracteres',
      })
      .optional(),
    logoUrl: z
      .union([z.string().url(), z.literal(''), z.null()])
      .optional()
      .transform((v) => v || null),
  }),
});
