// src/middlewares/isAdmin.middleware.ts
import { Request, Response, NextFunction } from "express";

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  // Ajustamos 'rol' a 'role' para que coincida con la Entidad User
  if (user && user.role === "admin") {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Acceso denegado. Se requiere rol de administrador." });
  }
};
