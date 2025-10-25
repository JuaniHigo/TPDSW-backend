// src/routes/user.routes.ts
import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import { isAuth } from "../middlewares/auth.middleware.js";

const router = Router();
router.get("/", isAuth, getAllUsers);
router.get("/:id", isAuth, getUserById);
router.put("/:id", isAuth, updateUser);
router.delete("/:id", isAuth, deleteUser);

export default router;
