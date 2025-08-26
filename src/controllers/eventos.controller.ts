import { Request, Response } from 'express';
import pool from '../config/database';

// Obtener todos los eventos con detalle y paginación
export const getAllEventos = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const sql = `
            SELECT 
                e.id_evento,
                e.fecha_hora,
                e.torneo,
                e.estado,
                cl.nombre AS nombre_local,
                cl.logo_url AS logo_local,
                cv.nombre AS nombre_visitante,
                cv.logo_url AS logo_visitante,
                est.nombre AS nombre_estadio

            FROM eventos AS e
            JOIN clubes AS cl ON e.fk_id_club_local = cl.id_club
            JOIN clubes AS cv ON e.fk_id_club_visitante = cv.id_club
            JOIN estadios AS est ON e.fk_id_estadio = est.id_estadio
            ORDER BY e.fecha_hora DESC
            LIMIT ? OFFSET ?
        `;

        const [rows] = await pool.query(sql, [limit, offset]);
        const [totalRows]: any = await pool.query("SELECT COUNT(*) as total FROM eventos");
        
        res.status(200).json({
            data: rows,
            pagination: {
                total: totalRows[0].total,
                page: page,
                limit: limit,
                totalPages: Math.ceil(totalRows[0].total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

// En src/controllers/eventos.controller.ts

export const getEventoById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        // --- ESTA ES LA CONSULTA CORREGIDA ---
        const sql = `
            SELECT 
                e.*,
                cl.nombre AS nombre_local,
                cl.logo_url AS logo_local,      -- <-- AÑADIDO
                cv.nombre AS nombre_visitante,
                cv.logo_url AS logo_visitante,  -- <-- AÑADIDO
                est.nombre AS nombre_estadio
            FROM eventos AS e
            JOIN clubes AS cl ON e.fk_id_club_local = cl.id_club
            JOIN clubes AS cv ON e.fk_id_club_visitante = cv.id_club
            JOIN estadios AS est ON e.fk_id_estadio = est.id_estadio
            WHERE e.id_evento = ?
        `;
        // ------------------------------------

        const [rows] = await pool.query(sql, [id]);
        if ((rows as any[]).length === 0) {
            res.status(404).json({ message: 'Evento no encontrado' });
            return;
        }
        res.status(200).json((rows as any[])[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};
// Crear un nuevo evento
export const createEvento = async (req: Request, res: Response): Promise<void> => {
    try {
        const [result] = await pool.query("INSERT INTO eventos SET ?", [req.body]);
        const insertId = (result as any).insertId;
        res.status(201).json({ id_evento: insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

// Actualizar un evento
export const updateEvento = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("UPDATE eventos SET ? WHERE id_evento = ?", [req.body, id]);
        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Evento no encontrado para actualizar" });
            return;
        }
        res.status(200).json({ message: "Evento actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

// Eliminar un evento
export const deleteEvento = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("DELETE FROM eventos WHERE id_evento = ?", [id]);
        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Evento no encontrado para eliminar" });
            return;
        }
        res.status(200).json({ message: "Evento eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};