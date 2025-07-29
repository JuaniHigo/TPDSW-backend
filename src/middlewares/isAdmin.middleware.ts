import { Request, Response, NextFunction } from 'express';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    // Asumimos que el middleware 'isAuth' ya se ejecutó
    // y nos dejó el payload del token en (req as any).user
    const user = (req as any).user;

    if (user && user.rol === 'admin') {
        // Si el usuario existe y su rol es 'admin', le damos paso
        next();
    } else {
        // Si no, le negamos el acceso
        res.status(403).json({ message: "Acceso denegado. Se requiere rol de administrador." });
    }
};