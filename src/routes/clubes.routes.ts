import { Router } from "express";
import {
  getAllClubes,
  getClubById,
  createClub,
  updateClub,
  deleteClub,
} from "../controllers/clubes.controller";

import { isAuth } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/isAdmin.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createClubSchema, updateClubSchema } from "../schemas/club.schema";

const router = Router();

router.get("/", getAllClubes);
router.get("/:id", getClubById);

router.post("/", [isAuth, isAdmin, validate(createClubSchema)], createClub);
router.put("/:id", [isAuth, isAdmin, validate(updateClubSchema)], updateClub);
router.delete("/:id", [isAuth, isAdmin], deleteClub);

export default router;