import { Request, Response } from 'express';
import pool from '../config/database';
import { Sector } from '../interfaces/sectores.interface';

// Obtener todos los sectores con paginación
export const getAllSectores = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const [rows] = await pool.query(
            "SELECT * FROM sectores LIMIT ? OFFSET ?",
            [limit, offset]
        );

        const [totalRows]: any = await pool.query("SELECT COUNT(*) as total FROM sectores");
        const totalSectores = totalRows[0].total;

        res.status(200).json({
            data: rows,
            pagination: {
                total: totalSectores,
                page,
                limit,
                totalPages: Math.ceil(totalSectores / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

//Obtener un sector por ID compuesto
export const getSectorById = async (req: Request, res: Response): Promise<void> => {
    const { id_sector, fk_id_estadio } = req.params;
    try {
        const [rows] = await pool.query(
            "SELECT * FROM sectores WHERE id_sector = ? AND fk_id_estadio = ? " ,
            [id_sector, fk_id_estadio]
        );
        if ((rows as any[]).length === 0) {
            res.status(404).json({ message: 'Sector no encontrado' });
            return;
        }
        res.status(200).json((rows as any[])[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

// Crear un nuevo sector
export const createSector = async (req: Request, res: Response): Promise<void> => {
    const newSector: Omit<Sector, 'id_sector'> = req.body;
    try {
        const [result] = await pool.query("INSERT INTO sectores SET ?", [newSector]);
        const insertId = (result as any).insertId;
        res.status(201).json({ id_sector: insertId, ...newSector });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

// Actualizar un sector
export const updateSector = async (req: Request, res: Response): Promise<void> => {
    const { id_sector, fk_id_estadio } = req.params;
    const sectorToUpdate: Partial<Sector> = req.body;
    try {
        const [result] = await pool.query(
            "UPDATE sectores SET ? WHERE id_sector = ? AND fk_id_estadio = ?",
            [sectorToUpdate, id_sector, fk_id_estadio]
        );
        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Sector no encontrado para actualizar" });
            return;
        }
        res.status(200).json({ message: "Sector actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

// Eliminar un sector
export const deleteSector = async (req: Request, res: Response): Promise<void> => {
    const { id_sector, fk_id_estadio } = req.params;
    try {
        const [result] = await pool.query(
            "DELETE FROM sectores WHERE id_sector = ? AND fk_id_estadio = ?",
            [id_sector, fk_id_estadio]
        );
        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Sector no encontrado para eliminar" });
            return;
        }
        res.status(200).json({ message: "Sector eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};