import { Router } from "express";
import {
  getAllClubes,
  getClubById,
  createClub,
  updateClub,
  deleteClub,
} from "../controllers/clubes.controller";

// 1. IMPORTAMOS LOS DOS MIDDLEWARES
import { isAuth } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/isAdmin.middleware";

const router = Router();

// Ruta pública (Cualquiera puede ver los clubes)
router.get("/", getAllClubes);

// Ruta pública (Cualquiera puede ver un club)
router.get("/:id", getClubById);

// 2. APLICAMOS LA CADENA CORRECTA: [isAuth, isAdmin]
// (Solo un admin autenticado puede crear un club)
router.post("/", [isAuth, isAdmin], createClub);

// (Solo un admin autenticado puede actualizar un club)
router.put("/:id", [isAuth, isAdmin], updateClub);

// (Solo un admin autenticado puede borrar un club)
router.delete("/:id", [isAuth, isAdmin], deleteClub);

export default router;