import { Request, Response } from "express";
import { orm } from "../app";
import { Usuarios } from "../entities/Usuarios";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { password, ...userData } = req.body;

    if (!password || password.trim() === "") {
      return res.status(400).json({ message: "La contraseña es obligatoria." });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = orm.em.create(Usuarios, {
      ...userData,
      password: hashedPassword,
      fecha_nacimiento: userData.fecha_nacimiento || null,
    });

    await orm.em.flush();

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
      return res
        .status(500)
        .json({ message: "Error en el servidor", error: error.message });
    }
  }
  return res.status(500).json({ message: "Error desconocido en el registro." });
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;
    console.log("--- Nuevo Intento de Login ---");

    // 1. Buscar al usuario por email
    const user = await orm.em.getRepository(Usuarios).findOne({ email });

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
      rol: (user as any).rol, // Asumiendo que 'rol' existe, aunque no está en tu SQL
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
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
