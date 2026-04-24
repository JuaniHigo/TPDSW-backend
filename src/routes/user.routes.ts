import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getMisEntradas,
} from "../controllers/user.controller";

import { isAuth } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/isAdmin.middleware";
import { validate } from "../middlewares/validate.middleware";
import { updateUserSchema } from "../schemas/user.schema";

const router = Router();

// --- Rutas de Usuario Autenticado (ANTES de /:id para evitar shadowing) ---
router.get("/me/entradas", isAuth, getMisEntradas);

// --- Rutas de Administrador ---
router.get("/", [isAuth, isAdmin], getAllUsers);
router.get("/:id", [isAuth, isAdmin], getUserById);
router.put("/:id", [isAuth, isAdmin, validate(updateUserSchema)], updateUser);
router.delete("/:id", [isAuth, isAdmin], deleteUser);

export default router;
