import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ⛔ CAMBIO 1: No importamos 'orm' desde 'app'.
// Importamos RequestContext para OBTENER el 'em'
import { RequestContext } from "@mikro-orm/core";

// ⛔ CAMBIO 2: Importamos la clase 'Usuario' (singular)
import { Usuario } from "../entities/Usuario";

export const register = async (
  req: Request,
  res: Response
): Promise<Response> => {
  // ⛔ CAMBIO 3: Obtenemos el EntityManager (em) del contexto
  // El '!' al final es para decirle a TS "confía en mí, esto existe"
  // (Existe porque nuestro middleware en app.ts lo garantiza)
  const em = RequestContext.getEntityManager()!;

  try {
    const { password, ...userData } = req.body;

    if (!password || password.trim() === "") {
      return res.status(400).json({ message: "La contraseña es obligatoria." });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ⛔ CAMBIO 4: Usamos 'em' (del RequestContext) en lugar de 'orm.em'
    // ⛔ CAMBIO 5: Usamos 'Usuario' (singular)
    // ⛔ CAMBIO 6: Corregimos 'fecha_nacimiento' a 'fechaNacimiento'
    const newUser = em.create(Usuario, {
      ...userData,
      password: hashedPassword,
      fechaNacimiento: userData.fechaNacimiento || null, // DEBE ser camelCase
    });

    // ⛔ CAMBIO 7: Usamos 'em' (del RequestContext)
    await em.flush();

    return res
      .status(201)
      .json({ message: "Usuario registrado correctamente." });
  } catch (error: any) {
    if (
      error.code === "ER_DUP_ENTRY" ||
      error.name === "UniqueConstraintViolationException"
    ) {
      return res
        .status(409)
        .json({ message: "El DNI o Email ya están registrados." });
    } else {
      console.error("Error en register:", error); // Es buena idea loguear el error
      return res
        .status(500)
        .json({ message: "Error en el servidor", error: error.message });
    }
  }
  // ⛔ CAMBIO 8: Eliminamos el 'return' final que era inalcanzable.
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  // ⛔ CAMBIO 9: Obtenemos el 'em' también aquí
  const em = RequestContext.getEntityManager()!;

  try {
    const { email, password } = req.body;
    console.log("--- Nuevo Intento de Login ---");

    // 1. Buscar al usuario por email
    // ⛔ CAMBIO 10: Usamos 'em' y 'Usuario' (singular)
    const user = await em.getRepository(Usuario).findOne({ email });

    if (!user) {
      console.log("RESULTADO: Usuario no encontrado en la BD.");
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    // 2. Comparar la contraseña
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      console.log("FALLO: Las contraseñas no coinciden.");
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    // 3. Crear el token JWT
    const payload = {
      idUsuario: user.idUsuario,
      email: user.email,
      rol: user.rol, // Ya no es 'any' porque usamos la clase correcta
    };

    // Es mejor mover el secret a una variable de entorno (.env)
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("Error crítico: JWT_SECRET no está definido en .env");
      return res.status(500).json({ message: "Error de configuración del servidor." });
    }

    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: "1h",
    });

    console.log("ÉXITO: Login correcto, token generado.");
    return res.status(200).json({ token });
  } catch (error: any) {
    console.error("ERROR CATASTRÓFICO EN LOGIN:", error);
    return res
      .status(500)
      .json({ message: "Error en el servidor", error: error.message });
  }
};