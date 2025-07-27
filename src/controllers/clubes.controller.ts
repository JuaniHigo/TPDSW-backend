import { Request, Response } from 'express';
import pool from '../config/database';
import { Club } from '../interfaces/clubes.interface';

// Obtener todos los clubes (con paginación)
export const getAllClubes = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const [rows] = await pool.query(
            "SELECT id_club, nombre, prefijo FROM clubes LIMIT ? OFFSET ?", 
            [limit, offset]
        );
        
        const [totalRows]: any = await pool.query("SELECT COUNT(*) as total FROM clubes");
        const totalClubes = totalRows[0].total;

        res.status(200).json({
            data: rows,
            pagination: {
                total: totalClubes,
                page: page,
                limit: limit,
                totalPages: Math.ceil(totalClubes / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

// Obtener un club por ID
export const getClubById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT id_club, nombre, prefijo FROM clubes WHERE id_club = ?", [id]);
        if ((rows as any[]).length === 0) {
            res.status(404).json({ message: 'Club no encontrado' });
            return;
        }
        res.status(200).json((rows as any[])[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

// Crear un nuevo club
export const createClub = async (req: Request, res: Response): Promise<void> => {
    const newClub: Omit<Club, 'id_club'> = req.body;
    try {
        const [result] = await pool.query("INSERT INTO clubes SET ?", [newClub]);
        const insertId = (result as any).insertId;
        res.status(201).json({ id_club: insertId, ...newClub });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'El nombre o prefijo del club ya existe.' });
        } else {
            res.status(500).json({ message: 'Error interno del servidor', error });
        }
    }
};

// Actualizar un club
export const updateClub = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const clubToUpdate: Partial<Club> = req.body;
    try {
        const [result] = await pool.query("UPDATE clubes SET ? WHERE id_club = ?", [clubToUpdate, id]);
        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Club no encontrado para actualizar" });
            return;
        }
        res.status(200).json({ message: "Club actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

// Eliminar un club
export const deleteClub = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("DELETE FROM clubes WHERE id_club = ?", [id]);
        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Club no encontrado para eliminar" });
            return;
        }
        res.status(200).json({ message: "Club eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};