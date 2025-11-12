import { Router } from "express";
import {
  getAllEventos,
  getEventoById,
  createEvento,
  updateEvento,
  deleteEvento,
} from "../controllers/eventos.controller";

// Importamos los dos middlewares
import { isAuth } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/isAdmin.middleware";

const router = Router();

// --- Rutas Públicas ---
router.get("/", getAllEventos);
router.get("/:id", getEventoById);

// --- Rutas de Administrador ---
router.post("/", [isAuth, isAdmin], createEvento);
router.put("/:id", [isAuth, isAdmin], updateEvento);
router.delete("/:id", [isAuth, isAdmin], deleteEvento);

export default router;