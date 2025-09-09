// src/services/AuthService.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Database } from "../config/database";
import { User, UserRole } from "../entities/User.entity";
import { UserRepository } from "../repositories/UserRepository";

interface RegisterData {
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  fecha_nacimiento?: Date;
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = Database.getEM().getRepository(
      User
    ) as UserRepository;
  }

  async register(data: RegisterData): Promise<{ message: string }> {
    const em = Database.getEM().fork();

    try {
      // Verificar si el usuario ya existe
      const existingUser = await em.getRepository(User).findOne({
        $or: [{ email: data.email }, { dni: data.dni }],
      });

      if (existingUser) {
        throw new Error("Usuario ya existe con ese email o DNI");
      }

      // Hash de la contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

      // Crear nuevo usuario
      const newUser = new User({
        dni: data.dni,
        nombre: data.nombre,
        apellidos: data.apellido,
        email: data.email,
        password: hashedPassword,
        fechaNacimiento: data.fecha_nacimiento,
        role: UserRole.USER,
      });

      em.persist(newUser);
      await em.flush();

      return { message: "Usuario registrado correctamente." };
    } catch (error) {
      throw error;
    }
  }

  async login(
    data: LoginData
  ): Promise<{ token: string; user: Partial<User> }> {
    const em = Database.getEM().fork();

    try {
      // Buscar usuario por email
      const user = await em.getRepository(User).findOne({ email: data.email });

      if (!user) {
        throw new Error("Credenciales inválidas.");
      }

      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(
        data.password,
        user.password
      );

      if (!isPasswordValid) {
        throw new Error("Credenciales inválidas.");
      }

      // Generar token JWT
      const payload = {
        id_usuario: user.id,
        email: user.email,
        rol: user.role,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: "1h",
      });

      // Retornar datos sin password
      const { password, ...userWithoutPassword } = user;

      return {
        token,
        user: userWithoutPassword,
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as any;
      const em = Database.getEM().fork();

      return await em.getRepository(User).findOne({ id: decoded.id_usuario });
    } catch (error) {
      return null;
    }
  }
}
