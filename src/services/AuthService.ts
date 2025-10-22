// src/services/AuthService.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Database } from "../config/database.js";
import { User, UserRole } from "../entities/User.entity.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { wrap, EntityDTO } from "@mikro-orm/core"; // Importación corregida

// Usamos Partial<User> en lugar de la interfaz
interface RegisterData extends Partial<User> {
  password_confirmation?: string; // (si tuvieras)
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    // Obtenemos el EM del contexto de la request
    this.userRepository = Database.getEM().getRepository(
      User
    ) as UserRepository;
  }

  async register(
    data: RegisterData
  ): Promise<{ message: string; user: EntityDTO<User> }> { // <-- TIPO CORREGIDO
    const em = this.userRepository.getEntityManager().fork();

    try {
      // Verificar si el usuario ya existe
      const existingUser = await em.getRepository(User).findOne({
        $or: [{ email: data.email! }, { dni: data.dni! }],
      });

      if (existingUser) {
        throw new Error("Usuario ya existe con ese email o DNI");
      }

      // Hash de la contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(data.password!, saltRounds);

      // Crear nuevo usuario
      const newUser = new User({
        dni: data.dni!,
        nombre: data.nombre!,
        apellidos: data.apellidos!,
        email: data.email!,
        password: hashedPassword,
        fechaNacimiento: data.fechaNacimiento,
        role: UserRole.USER,
      });

      em.persist(newUser);
      await em.flush();

      return {
        message: "Usuario registrado correctamente.",
        // CORREGIDO: Usamos la instancia 'newUser' y la propiedad 'user'
        user: wrap(newUser).toObject(), 
      };
    } catch (error) {
      throw error;
    }
  }

  async login(
    data: LoginData
  ): Promise<{ token: string; user: EntityDTO<User> }> { // <-- TIPO CORREGIDO
    const em = this.userRepository.getEntityManager().fork();

    try {
      // Buscar usuario por email (ya no necesitamos 'pool')
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

      return {
        token,
        // CORREGIDO: Usamos la instancia 'user' que encontramos
        user: wrap(user).toObject(), 
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