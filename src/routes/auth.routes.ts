import { Router } from "express";
import { register, login } from "../controllers/auth.controller";
// (Opcional) Aquí podrías agregar validaciones de Zod si quisieras

const router = Router();

// 1. Ruta de Registro
// POST /api/auth/register
router.post("/register", register);

// 2. Ruta de Login
// POST /api/auth/login
router.post("/login", login);

export default router;