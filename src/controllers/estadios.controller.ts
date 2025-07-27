import { Request, Response } from 'express';
import pool from '../config/database';
import { Estadio } from '../interfaces/estadios.interface';

// Obtener todos los estadios con paginación
export const getAllEstadios = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const [rows] = await pool.query(
            "SELECT id_estadio, nombre, calle, numero, ciudad FROM estadios LIMIT ? OFFSET ?", 
            [limit, offset]
        );
        
        const [totalRows]: any = await pool.query("SELECT COUNT(*) as total FROM estadios");
        const totalEstadios = totalRows[0].total;

        res.status(200).json({
            data: rows,
            pagination: {
                total: totalEstadios,
                page: page,
                limit: limit,
                totalPages: Math.ceil(totalEstadios / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

// Obtener un estadio por ID
export const getEstadioById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT id_estadio, nombre, calle, numero, ciudad FROM estadios WHERE id_estadio = ?", [id]);
        if ((rows as any[]).length === 0) {
            res.status(404).json({ message: 'Estadio no encontrado' });
            return;
        }
        res.status(200).json((rows as any[])[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

// Crear un nuevo estadio
export const createEstadio = async (req: Request, res: Response): Promise<void> => {
    const newEstadio: Omit<Estadio, 'id_estadio'> = req.body;
    try {
        const [result] = await pool.query("INSERT INTO estadios SET ?", [newEstadio]);
        const insertId = (result as any).insertId;
        res.status(201).json({ id_estadio: insertId, ...newEstadio });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

// Actualizar un estadio
export const updateEstadio = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const estadioToUpdate: Partial<Estadio> = req.body;
    try {
        const [result] = await pool.query("UPDATE estadios SET ? WHERE id_estadio = ?", [estadioToUpdate, id]);
        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Estadio no encontrado para actualizar" });
            return;
        }
        res.status(200).json({ message: "Estadio actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

// Eliminar un estadio
export const deleteEstadio = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("DELETE FROM estadios WHERE id_estadio = ?", [id]);
        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Estadio no encontrado para eliminar" });
            return;
        }
        res.status(200).json({ message: "Estadio eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};