// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { User } from "../entities/User.entity"; // <-- Importa la Entidad

const authService = new AuthService();

export const register = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // El body ya es compatible con Partial<User> gracias a la validación de Zod
    const newUser: Partial<User> = req.body;

    if (!newUser.password || newUser.password.trim() === "") {
      return res.status(400).json({ message: "La contraseña es obligatoria." });
    }

    const result = await authService.register(newUser);

    return res.status(201).json(result);
  } catch (error: any) {
    if (error.message.includes("Usuario ya existe")) {
      return res.status(409).json({ message: error.message });
    }
    return res
      .status(500)
      .json({ message: "Error en el servidor", error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;
    console.log("--- Nuevo Intento de Login ---");

    const result = await authService.login({ email, password });

    console.log("ÉXITO: Login correcto, token generado.");
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message.includes("Credenciales inválidas")) {
      console.log("FALLO: Credenciales inválidas.");
      return res.status(401).json({ message: error.message });
    }
    console.error("ERROR CATASTRÓFICO EN LOGIN:", error);
    return res
      .status(500)
      .json({ message: "Error en el servidor", error: error.message });
  }
};
