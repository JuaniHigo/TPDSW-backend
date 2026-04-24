import { Router } from "express";
import {
  getPreciosPorEvento,
  setPrecio,
  deletePrecio,
} from "../controllers/precios.controller";

import { isAuth } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/isAdmin.middleware";
import { validate } from "../middlewares/validate.middleware";
import { setPrecioSchema } from "../schemas/precio.schema";

const router = Router();

router.get("/evento/:idEvento", getPreciosPorEvento);

router.post("/", [isAuth, isAdmin, validate(setPrecioSchema)], setPrecio);
router.delete("/:idEvento/:idSector", [isAuth, isAdmin], deletePrecio);

export default router;