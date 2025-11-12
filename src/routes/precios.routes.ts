import { Router } from "express";
import {
  getPreciosPorEvento,
  setPrecio,
  deletePrecio,
} from "../controllers/precios.controller";

// Importamos los dos middlewares
import { isAuth } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/isAdmin.middleware";

const router = Router();

// --- Ruta Pública ---
router.get("/evento/:id_evento", getPreciosPorEvento);

// --- Rutas de Administrador ---
router.post("/", [isAuth, isAdmin], setPrecio);
router.delete("/:id_evento/:id_sector", [isAuth, isAdmin], deletePrecio);

export default router;