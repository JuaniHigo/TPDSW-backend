import { Router } from "express";
import {
  getAllSectores,
  getSectorById,
  createSector,
  updateSector,
  deleteSector,
} from "../controllers/sectores.controller";

import { isAuth } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/isAdmin.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createSectorSchema, updateSectorSchema } from "../schemas/sector.schema";

const router = Router();

router.get("/", getAllSectores);
router.get("/:id", getSectorById);

router.post("/", [isAuth, isAdmin, validate(createSectorSchema)], createSector);
router.put("/:id", [isAuth, isAdmin, validate(updateSectorSchema)], updateSector);
router.delete("/:id", [isAuth, isAdmin], deleteSector);

export default router;