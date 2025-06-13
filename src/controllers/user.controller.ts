// src/controllers/user.controller.ts

// Importamos los tipos que necesitamos directamente
import { Request, Response } from 'express'; 
import pool from '../config/database';
import { User } from '../interfaces/user.interface';
import bcrypt from 'bcrypt';

export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const newUser: User = req.body;

        // Validaciones básicas
        if (!newUser.dni || !newUser.nombre || !newUser.email || !newUser.password) {
            res.status(400).json({ message: 'Faltan datos obligatorios' });
            return;
        }

        // Validar DNI (7 u 8 dígitos numéricos)
        if (!/^\d{7,8}$/.test(newUser.dni)) {
            res.status(400).json({ message: 'DNI no válido' });
            return;
        }

        // (Opcional) Validar email con regex simple o librería externa
        // Aquí podrías agregar validación de email si querés

        // Hashear la contraseña antes de guardarla
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newUser.password, saltRounds);

        // Insertar en la base de datos
        const sql = "INSERT INTO Usuarios (dni, nombre, apellido, email, password, fecha_nacimiento) VALUES (?, ?, ?, ?, ?, ?)";
        const [result] = await pool.query(sql, [
            newUser.dni,
            newUser.nombre,
            newUser.apellido,
            newUser.email,
            hashedPassword,
            newUser.fecha_nacimiento || null
        ]);

        const insertedId = (result as any).insertId;
        res.status(201).json({ message: 'Usuario creado', id: insertedId });

    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'El DNI o Email ya existe.' });
        } else {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    }
};


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