// src/controllers/user.controller.ts
import { Request, Response } from "express";
import { UserService } from "../services/UserService";
import { NotFoundError } from "../utils/errors";
import { parseIntOr } from "../utils/parser.utils";

const userService = new UserService();

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = parseIntOr(req.params.id, 0);
    const user = await userService.getUserById(id);

    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }
    res.status(200).json(user);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = parseIntOr(req.params.id, 0);
    const updatedUser = await userService.updateUser(id, req.body);
    res.status(200).json({ message: "Usuario actualizado", user: updatedUser });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res
        .status(500)
        .json({ message: "Error interno del servidor", error: error.message });
    }
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = parseIntOr(req.params.id, 0);
    await userService.deleteUser(id);
    res.status(200).json({ message: "Usuario eliminado" });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
    } else {
      res
        .status(500)
        .json({ message: "Error interno del servidor", error: error.message });
    }
  }
};
