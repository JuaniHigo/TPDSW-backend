import { Request, Response, NextFunction } from 'express';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  // --- NUESTROS ESPÍAS ---
  console.log("\n--- 🕵️‍♂️ (DEBUG) MIDDLEWARE 'isAdmin' ---");
  const user = (req as any).user;

  if (user) {
    console.log("req.user EXISTE. Email:", user.email, "con ROL:", user.rol);
  } else {
    console.log("ERROR: req.user NO EXISTE. Salió por done(null, false).");
  }
  // --- FIN ESPÍAS ---

  if (user && user.rol === 'admin') {
    // --- MÁS ESPÍAS ---
    console.log("RESULTADO: Acceso CONCEDIDO.");
    // --- FIN ESPÍAS ---
    next();
  } else {
    // --- MÁS ESPÍAS ---
    console.log("RESULTADO: Acceso DENEGADO.");
    // --- FIN ESPÍAS ---
    res.status(403).json({ message: "Acceso denegado. Se requiere rol de administrador." });
  }
};