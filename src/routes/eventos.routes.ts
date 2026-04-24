import { Router } from "express";
import {
  getAllEventos,
  getEventoById,
  createEvento,
  updateEvento,
  deleteEvento,
} from "../controllers/eventos.controller";

import { isAuth } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/isAdmin.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createEventoSchema, updateEventoSchema } from "../schemas/evento.schema";

const router = Router();

router.get("/", getAllEventos);
router.get("/:id", getEventoById);

router.post("/", [isAuth, isAdmin, validate(createEventoSchema)], createEvento);
router.put("/:id", [isAuth, isAdmin, validate(updateEventoSchema)], updateEvento);
router.delete("/:id", [isAuth, isAdmin], deleteEvento);

export default router;