import { Router } from "express";
import {
  getAllSectores,
  getSectorById,
  createSector,
  updateSector,
  deleteSector,
} from "../controllers/sectores.controller";

// Importamos los dos middlewares
import { isAuth } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/isAdmin.middleware";

const router = Router();

// --- Rutas Públicas ---
// (Asumiendo que cualquiera puede ver los sectores de un estadio,
// el controlador 'getAllSectores' debería filtrar por ?estadioId=X)
router.get("/", getAllSectores);
router.get("/:id", getSectorById); // (Asumiendo que el ID es único)

// --- Rutas de Administrador ---
router.post("/", [isAuth, isAdmin], createSector);
router.put("/:id", [isAuth, isAdmin], updateSector);
router.delete("/:id", [isAuth, isAdmin], deleteSector);

export default router;