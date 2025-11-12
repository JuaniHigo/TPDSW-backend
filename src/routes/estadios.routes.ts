import { Router } from "express";
import {
  getAllEstadios,
  getEstadioById,
  createEstadio,
  updateEstadio,
  deleteEstadio,
} from "../controllers/estadios.controller";

// Importamos los dos middlewares
import { isAuth } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/isAdmin.middleware";

const router = Router();

// --- Rutas Públicas ---
router.get("/", getAllEstadios);
router.get("/:id", getEstadioById);

// --- Rutas de Administrador ---
router.post("/", [isAuth, isAdmin], createEstadio);
router.put("/:id", [isAuth, isAdmin], updateEstadio);
router.delete("/:id", [isAuth, isAdmin], deleteEstadio);

export default router;