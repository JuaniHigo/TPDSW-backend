import { Request, Response } from 'express';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import pool from '../config/database';
import dotenv from 'dotenv';
import QRCode from 'qrcode';
import bcrypt from 'bcrypt'; // Asegúrate de tener bcrypt importado si lo usas en otras funciones

dotenv.config();

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! 
});

export const crearPreferenciaMercadoPago = async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id_usuario;

    if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const { eventoId, sectorId, quantity } = req.body;

    if (!eventoId || !sectorId || !quantity) {
        return res.status(400).json({ message: 'Faltan datos (evento, sector, cantidad).' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [priceRows]: any = await connection.query(
            "SELECT precio FROM precios_evento_sector WHERE fk_id_evento = ? AND fk_id_sector = ?",
            [eventoId, sectorId]
        );
        if (priceRows.length === 0) {
            throw new Error('Precio no encontrado para el sector y evento especificados.');
        }
        const monto_total = priceRows[0].precio * Number(quantity);

        const [compraResult]: any = await connection.query(
            "INSERT INTO compras (fk_id_usuario, monto_total, metodo_pago, estado_pago) VALUES (?, ?, ?, ?)",
            [userId, monto_total, 'mercadopago', 'pendiente']
        );
        const id_compra = compraResult.insertId;

        const preference = new Preference(client);
        const preferenceResult = await preference.create({
            body: {
                items: [
                    {
                        id: `evento-${eventoId}-sector-${sectorId}`,
                        title: `Entrada Evento #${eventoId}`,
                        description: `Entrada para el sector #${sectorId}`,
                        quantity: Number(quantity),
                        unit_price: Number(priceRows[0].precio),
                        currency_id: 'ARS'
                    }
                ],
                back_urls: {
                    success: `${process.env.FRONTEND_URL}/compra-exitosa`,
                    failure: `${process.env.FRONTEND_URL}/compra-fallida`,
                },
                auto_return: 'approved',
                external_reference: id_compra.toString(),
            }
        });

        await connection.query(
            "UPDATE compras SET id_preferencia_mp = ? WHERE id_compra = ?",
            [preferenceResult.id, id_compra]
        );

        await connection.commit();
        res.status(201).json({ preferenceId: preferenceResult.id });

    } catch (error) {
        await connection.rollback();
        console.error('Error al crear la preferencia:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    } finally {
        connection.release();
    }
};

// NUEVA FUNCIÓN para procesar pagos con tarjeta (simulado)
export const procesarPagoTarjeta = async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id_usuario;
    if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const { eventoId, sectorId, quantity } = req.body;
    if (!eventoId || !sectorId || !quantity) {
        return res.status(400).json({ message: 'Faltan datos para procesar la compra.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [priceRows]: any = await connection.query(
            "SELECT precio FROM precios_evento_sector WHERE fk_id_evento = ? AND fk_id_sector = ?",
            [eventoId, sectorId]
        );
        if (priceRows.length === 0) {
            throw new Error('Precio no encontrado.');
        }
        const monto_total = priceRows[0].precio * Number(quantity);

        const [compraResult]: any = await connection.query(
            "INSERT INTO compras (fk_id_usuario, monto_total, metodo_pago, estado_pago) VALUES (?, ?, ?, ?)",
            [userId, monto_total, 'tarjeta', 'completada']
        );
        const id_compra = compraResult.insertId;

        for (let i = 0; i < quantity; i++) {
            // CAMBIO: Insertamos un valor temporal en codigo_qr para evitar el error
            const [entradaResult]: any = await connection.query(
                "INSERT INTO entradas (fk_id_compra, fk_id_evento, fk_id_sector, codigo_qr) VALUES (?, ?, ?, ?)",
                [id_compra, eventoId, sectorId, 'generating...']
            );
            const id_entrada = entradaResult.insertId;

            const qrData = JSON.stringify({ entradaId: id_entrada, eventoId, compraId: id_compra });
            const qrCodeUrl = await QRCode.toDataURL(qrData);

            await connection.query(
                "UPDATE entradas SET codigo_qr = ? WHERE id_entrada = ?",
                [qrCodeUrl, id_entrada]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Compra procesada con éxito.', id_compra: id_compra });

    } catch (error) {
        await connection.rollback();
        console.error("Error al procesar pago con tarjeta:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    } finally {
        connection.release();
    }
};


export const recibirConfirmacionPago = async (req: Request, res: Response) => {
    const { data } = req.body;
    if (data && data.id) {
        const connection = await pool.getConnection();
        try {
            const payment = new Payment(client);
            const paymentInfo = await payment.get({ id: data.id });

            if (paymentInfo && paymentInfo.status === 'approved' && paymentInfo.external_reference) {
                const id_compra = paymentInfo.external_reference;

                await connection.beginTransaction();

                await connection.query(
                    "UPDATE compras SET estado_pago = 'completada', id_pago_mp = ? WHERE id_compra = ?",
                    [paymentInfo.id, id_compra]
                );

                // Lógica para obtener datos de la compra y crear entradas
                // Esta parte puede necesitar ajustes según cómo almacenes la info de la preferencia
                const [compraRows]: any = await connection.query(
                    `SELECT fk_id_usuario, eventoId, sectorId, quantity FROM tu_tabla_temporal WHERE id_compra = ?`, 
                    [id_compra]
                );

                if (compraRows.length > 0) {
                    const { eventoId, sectorId, quantity } = compraRows[0];

                    for (let i = 0; i < quantity; i++) {
                        const [entradaResult]: any = await connection.query(
                            "INSERT INTO entradas (fk_id_compra, fk_id_evento, fk_id_sector) VALUES (?, ?, ?)",
                            [id_compra, eventoId, sectorId]
                        );
                        const id_entrada = entradaResult.insertId;

                        const qrData = JSON.stringify({ entradaId: id_entrada, eventoId, compraId: id_compra });
                        const qrCodeUrl = await QRCode.toDataURL(qrData);

                        await connection.query(
                            "UPDATE entradas SET codigo_qr = ? WHERE id_entrada = ?",
                            [qrCodeUrl, id_entrada]
                        );
                    }
                }
                await connection.commit();
            }
        } catch (error) {
            await connection.rollback();
            console.error("Error en el webhook de Mercado Pago:", error);
        } finally {
            connection.release();
        }
    }
    res.status(200).send("OK");
};
// ... (otras funciones del controlador)

export const getEntradasPorCompra = async (req: Request, res: Response) => {
    const { id_compra } = req.params;
    const userId = (req.user as any)?.id_usuario;

    try {
        // --- CONSULTA SQL SIMPLIFICADA Y ROBUSTA ---
        const sql = `
            SELECT 
                e.id_entrada,
                e.codigo_qr,
                (SELECT cl.nombre FROM clubes cl JOIN eventos ev ON cl.id_club = ev.fk_id_club_local WHERE ev.id_evento = e.fk_id_evento) AS nombre_local,
                (SELECT cv.nombre FROM clubes cv JOIN eventos ev ON cv.id_club = ev.fk_id_club_visitante WHERE ev.id_evento = e.fk_id_evento) AS nombre_visitante
            FROM entradas e
            JOIN compras c ON e.fk_id_compra = c.id_compra
            WHERE e.fk_id_compra = ? AND c.fk_id_usuario = ?
        `;
        // ---------------------------------------------

        const [rows]: any = await pool.query(sql, [id_compra, userId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error detallado al obtener entradas:", error);
        res.status(500).json({ message: "Error al obtener las entradas." });
    }
};