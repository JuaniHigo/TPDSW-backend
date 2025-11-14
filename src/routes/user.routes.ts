import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getMisEntradas,
} from "../controllers/user.controller";

// Importamos los dos middlewares (manejar usuarios es de admin)
import { isAuth } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/isAdmin.middleware";

const router = Router();

// --- Rutas de Administrador ---
router.get("/", [isAuth, isAdmin], getAllUsers);
router.get("/:id", [isAuth, isAdmin], getUserById);
router.put("/:id", [isAuth, isAdmin], updateUser);
router.delete("/:id", [isAuth, isAdmin], deleteUser);

// --- Rutas de Usuario Autenticado ---
router.get("/me/entradas", isAuth, getMisEntradas);

export default router;
