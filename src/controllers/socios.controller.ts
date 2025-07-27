import { Request, Response } from 'express';
import pool from '../config/database';
import { Socio } from '../interfaces/socios.interface';

// Crear nuevo socio
export const createSocio = async (req: Request, res: Response): Promise<void> => {
    // 1. Ya no esperamos nro_socio. Solo los IDs.
    const { fk_id_usuario, fk_id_club } = req.body;
    let connection; // Definimos la conexión aquí para que sea accesible en todo el scope

    try {
        // Obtenemos una conexión del pool para manejar la transacción
        connection = await pool.getConnection();
        // Iniciamos la transacción
        await connection.beginTransaction();

        // 2. Obtenemos el prefijo del club desde la BD
        const [clubRows]: any = await connection.query("SELECT prefijo FROM clubes WHERE id_club = ?", [fk_id_club]);
        if (clubRows.length === 0) {
            await connection.rollback(); // Deshacemos la transacción
            res.status(404).json({ message: "El club especificado no existe." });
            return;
        }
        const prefijo = clubRows[0].prefijo;

        // 3. Contamos cuántos socios tiene ya ese club para saber el próximo número
        const [socioRows]: any = await connection.query("SELECT COUNT(*) as total FROM socios WHERE fk_id_club = ?", [fk_id_club]);
        const nuevoNumero = socioRows[0].total + 1;

        // 4. Generamos el nuevo número de socio completo
        const nro_socio_generado = `${prefijo}-${nuevoNumero}`;
        
        // 5. Obtenemos la fecha actual en formato AAAA-MM-DD
        const fecha_asociacion = new Date().toISOString().slice(0, 10);

        // 6. Insertamos el nuevo socio con el número generado
        const sql = `
            INSERT INTO socios (fk_id_usuario, fk_id_club, nro_socio, fecha_asociacion)
            VALUES (?, ?, ?, ?)
        `;
        await connection.query(sql, [
            fk_id_usuario,
            fk_id_club,
            nro_socio_generado,
            fecha_asociacion
        ]);

        // Si todo salió bien, confirmamos la transacción
        await connection.commit();
        res.status(201).json({ message: 'Socio creado correctamente', nro_socio: nro_socio_generado });

    } catch (error: any) {
        // Si algo falla, deshacemos todos los cambios de la transacción
        if (connection) await connection.rollback();

        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'El usuario ya es socio de ese club.' });
        } else {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    } finally {
        // Finalmente, siempre liberamos la conexión para que otros la puedan usar
        if (connection) connection.release();
    }
};

// Obtener todos los socios
export const getAllSocios = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Leemos los parámetros de paginación de la URL (query params)
        // Si no vienen, usamos valores por defecto (página 1, 10 por página)
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        // 2. Calculamos el 'offset' (cuántos registros saltar)
        const offset = (page - 1) * limit;

        // 3. Hacemos dos consultas: una para los datos y otra para el total
        const [rows] = await pool.query(
            "SELECT fk_id_usuario, fk_id_club, nro_socio, fecha_asociacion FROM socios LIMIT ? OFFSET ?", 
            [limit, offset]
        );
        
        const [totalRows]: any = await pool.query("SELECT COUNT(*) as total FROM socios");
        const totalSocios = totalRows[0].total;

        // 4. Devolvemos una respuesta más completa, con los datos y la info de paginación
        res.status(200).json({
            data: rows,
            pagination: {
                total: totalSocios,
                page: page,
                limit: limit,
                totalPages: Math.ceil(totalSocios / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

// Obtener un socio específico
export const getSocioById = async (req: Request, res: Response): Promise<void> => {
    const { id_usuario, id_club } = req.params;

    try {
        const [rows] = await pool.query(
            "SELECT * FROM socios WHERE fk_id_usuario = ? AND fk_id_club = ?",
            [id_usuario, id_club]
        );

        if ((rows as any[]).length === 0) {
            res.status(404).json({ message: 'Socio no encontrado' });
            return;
        }

        res.status(200).json((rows as any[])[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

// Actualizar socio
// Versión mejorada de updateSocio
export const updateSocio = async (req: Request, res: Response): Promise<void> => {
    const { id_usuario, id_club } = req.params;
    const fieldsToUpdate: Partial<Socio> = req.body;

    // Si no se envía ningún dato para actualizar, devuelve un error.
    if (Object.keys(fieldsToUpdate).length === 0) {
        res.status(400).json({ message: 'No se proporcionaron datos para actualizar' });
        return;
    }

    // Construye la consulta dinámicamente
    const setClause = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
    const values = Object.values(fieldsToUpdate);

    // Agrega los IDs para el WHERE al final de los valores
    values.push(id_usuario);
    values.push(id_club);

    const sql = `UPDATE socios SET ${setClause} WHERE fk_id_usuario = ? AND fk_id_club = ?`;

    try {
        const [result] = await pool.query(sql, values);

        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Socio no encontrado para actualizar" });
            return;
        }

        res.status(200).json({ message: "Socio actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};

// Eliminar socio
export const deleteSocio = async (req: Request, res: Response): Promise<void> => {
    // CORRECCIÓN: Usar los mismos nombres definidos en la ruta
    const { id_usuario, id_club } = req.params;

    try {
        const [result] = await pool.query(
            "DELETE FROM socios WHERE fk_id_usuario = ? AND fk_id_club = ?",
            // CORRECCIÓN: Usar las variables correctas en la consulta
            [id_usuario, id_club]
        );

        if ((result as any).affectedRows === 0) {
            res.status(404).json({ message: "Socio no encontrado para eliminar" });
            return;
        }

        res.status(200).json({ message: "Socio eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};