import { Router } from "express";
import { isAuth } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/isAdmin.middleware";
import {
  getPreciosPorEvento,
  setPrecio,
  deletePrecio,
} from "../controllers/precios.controller";

const router = Router();

// --- Definición de Rutas para Precios ---

// Ruta pública/usuario para ver los precios de un evento específico
router.get("/:id_evento", getPreciosPorEvento);

// Ruta de admin para crear o actualizar un precio para un evento/sector
// (El controlador maneja la lógica de "crear si no existe, actualizar si existe")
router.post("/", isAuth, isAdmin, setPrecio);

// Ruta de admin para eliminar un precio específico
router.delete("/:id_evento/:id_sector", isAuth, isAdmin, deletePrecio);

export default router;
