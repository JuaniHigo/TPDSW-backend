import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        dni: z.string()
            .min(7, { message: "El DNI debe tener entre 7 y 8 dígitos" })
            .max(8, { message: "El DNI debe tener entre 7 y 8 dígitos" }),
        nombre: z.string()
            .min(2, { message: "El nombre es requerido" }),
        apellido: z.string()
            .min(2, { message: "El apellido es requerido" }),
        email: z.string()
            .email({ message: "El formato del email no es válido" }),
        password: z.string()
            .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
        fecha_nacimiento: z.string().optional()
    })
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email({ message: "El formato del email no es válido" }),
        password: z.string().min(1, { message: "La contraseña es requerida" })
    })
});