import { Router } from "express";
import {
  getAllEstadios,
  getEstadioById,
  createEstadio,
  updateEstadio,
  deleteEstadio,
} from "../controllers/estadios.controller";

import { isAuth } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/isAdmin.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createEstadioSchema, updateEstadioSchema } from "../schemas/estadio.schema";

const router = Router();

router.get("/", getAllEstadios);
router.get("/:id", getEstadioById);

router.post("/", [isAuth, isAdmin, validate(createEstadioSchema)], createEstadio);
router.put("/:id", [isAuth, isAdmin, validate(updateEstadioSchema)], updateEstadio);
router.delete("/:id", [isAuth, isAdmin], deleteEstadio);

export default router;