

import { Request, Response } from 'express';
import pool from '../config/database'; 
import { tipoEntrada } from '../interfaces/tipoEntrada.interface';
import { RowDataPacket,  ResultSetHeader } from 'mysql2/promise'; 


// 1. Obtener todos los tipos de entradas
export const getTipoEntradas = async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM tipo_entradas");
        res.status(200).json(rows as tipoEntrada[]);
    } catch (error) {
        console.error("Error al obtener los tipos de entradas:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// 2. Obtener un tipo de entrada por ID
export const getTipoEntradaByID = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM tipo_entradas WHERE id = ?", [id]);

        if (rows.length === 0) {
            res.status(404).json({ message: "Tipo de entrada no encontrado" });
            return;
        }

        res.status(200).json(rows[0] as tipoEntrada);
    } catch (error) {
        console.error("Error al obtener el tipo de entrada por ID:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// 3. Crear un nuevo tipo de entrada
export const createTipoEntrada = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nombre, precio } = req.body;
        // El tipo de retorno de un INSERT es ResultSetHeader
        const [result] = await pool.query<ResultSetHeader>("INSERT INTO tipo_entradas SET ?", [{ nombre, precio }]);

        const newEntry = { id: result.insertId, nombre, precio };

        res.status(201).json(newEntry);
    } catch (error: any) { 
        console.error("Error al crear el tipo de entrada:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: "El tipo de entrada ya existe." });
        } else {
            res.status(500).json({ message: "Error interno del servidor" });
        }
    }
};

// 4. Actualizar un tipo de entrada
export const updateTipoEntrada = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { nombre, precio } = req.body;
        
        const [result] = await pool.query<ResultSetHeader>("UPDATE tipo_entradas SET nombre = ?, precio = ? WHERE id = ?", [nombre, precio, id]);

        const affectedRows = result.affectedRows;
        if (affectedRows === 0) {
            res.status(404).json({ message: "Tipo de entrada no encontrado para actualizar" });
            return;
        }

        // Devolver la entrada actualizada, si lo deseas
        const [updatedRows] = await pool.query<RowDataPacket[]>("SELECT * FROM tipo_entradas WHERE id = ?", [id]);
        res.status(200).json(updatedRows[0] as tipoEntrada);

    } catch (error) {
        console.error("Error al actualizar el tipo de entrada:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// 5. Eliminar un tipo de entrada
export const deleteTipoEntrada = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const [result] = await pool.query<ResultSetHeader>("DELETE FROM tipo_entradas WHERE id = ?", [id]);

        const affectedRows = result.affectedRows;
        if (affectedRows === 0) {
            res.status(404).json({ message: "Tipo de entrada no encontrado para eliminar" });
            return;
        }
        
        res.status(200).json({ message: "Tipo de entrada eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar el tipo de entrada:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};