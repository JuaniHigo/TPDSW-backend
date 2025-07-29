// src/controllers/user.controller.ts

// Importamos los tipos que necesitamos directamente
import { Request, Response } from 'express'; 
import pool from '../config/database';
import { User } from '../interfaces/user.interface';
import bcrypt from 'bcrypt';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows] = await pool.query("SELECT id_usuario, dni, nombre, apellido, email, fecha_nacimiento FROM Usuarios");
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query("SELECT id_usuario, dni, nombre, apellido, email, fecha_nacimiento FROM Usuarios WHERE id_usuario = ?", [id]);
        
        if ((rows as any[]).length <= 0) {
            res.status(404).json({ message: "Usuario no encontrado" });
            return;
        }
        res.status(200).json((rows as any[])[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userToUpdate: User = req.body;
        
        const [result] = await pool.query("UPDATE Usuarios SET nombre = ?, apellido = ? WHERE id_usuario = ?", [
            userToUpdate.nombre, userToUpdate.apellido, id
        ]);
        
        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Usuario no encontrado para actualizar" });
            return;
        }
        
        res.status(200).json({ message: "Usuario actualizado" });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("DELETE FROM Usuarios WHERE id_usuario = ?", [id]);

        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Usuario no encontrado para eliminar" });
            return;
        }

        res.status(200).json({ message: "Usuario eliminado" });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};