import { z } from 'zod';

export const updateUserSchema = z.object({
    body: z.object({
        dni: z.string()
            .min(7, { message: "El DNI debe tener entre 7 y 8 dígitos" })
            .max(8, { message: "El DNI debe tener entre 7 y 8 dígitos" })
            .regex(/^\d+$/, { message: "El DNI debe contener solo dígitos" })
            .optional(),
        nombre: z.string()
            .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
            .optional(),
        apellido: z.string()
            .min(2, { message: "El apellido debe tener al menos 2 caracteres" })
            .optional(),
        email: z.string()
            .email({ message: "El formato del email no es válido" })
            .optional(),
        fechaNacimiento: z.string().optional(),
    })
});
