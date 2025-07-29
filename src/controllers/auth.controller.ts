import { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {User}  from '../interfaces/user.interface';

export const register = async (req: Request, res: Response): Promise<Response> => {
    try {
        const newUser: User = req.body;

        if (!newUser.password || newUser.password.trim() === '') {
            return res.status(400).json({ message: "La contraseña es obligatoria." });
        }
        // --- Tu código de hasheo, que ya está perfecto ---
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newUser.password, saltRounds);
        // --------------------------------------------------

        const sql = "INSERT INTO Usuarios (dni, nombre, apellido, email, password, fecha_nacimiento) VALUES (?, ?, ?, ?, ?, ?)";
        await pool.query(sql, [
            newUser.dni,
            newUser.nombre,
            newUser.apellido,
            newUser.email,
            hashedPassword,
            newUser.fecha_nacimiento || null
        ]);

        return res.status(201).json({ message: 'Usuario registrado correctamente.' });
    } catch (error) {
        return res.status(500).json({ message: 'Error en el servidor', error });
    }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, password } = req.body;
        console.log("--- Nuevo Intento de Login ---");
        console.log("Email recibido:", email);
        console.log("Password recibido:", password);

        // 1. Buscar al usuario por email
        const [rows]: any = await pool.query("SELECT * FROM Usuarios WHERE email = ?", [email]);
        if (rows.length === 0) {
            console.log("RESULTADO: Usuario no encontrado en la BD.");
            return res.status(401).json({ message: "Credenciales inválidas." });
        }
        const user = rows[0];
        console.log("Usuario encontrado en la BD:", user);
        console.log("Password hasheado de la BD:", user.password);

        // 2. Comparar la contraseña enviada con la hasheada en la BD
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        console.log("RESULTADO de bcrypt.compare:", isPasswordCorrect);

        if (!isPasswordCorrect) {
            console.log("FALLO: Las contraseñas no coinciden.");
            return res.status(401).json({ message: "Credenciales inválidas." });
        }

        // 3. Si todo es correcto, crear el token JWT
        const payload = {
        id_usuario: user.id_usuario,
        email: user.email,
        rol: user.rol // <-- AÑADIR ESTA LÍNEA
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });
        
        console.log("ÉXITO: Login correcto, token generado.");
        return res.status(200).json({ token: token });

    } catch (error) {
        console.error("ERROR CATASTRÓFICO EN LOGIN:", error);
        return res.status(500).json({ message: 'Error en el servidor', error });
    }
};