// src/services/AuthService.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Database } from "../config/database.js";
import { User, UserRole } from "../entities/User.entity.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { wrap, EntityDTO } from "@mikro-orm/core"; // <-- Importa wrap y EntityDTO

// ... (interfaces RegisterData, LoginData)

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = Database.getEM().getRepository(
      User
    ) as UserRepository;
  }

  async register(
    data: RegisterData
  ): Promise<{ message: string; user: EntityDTO<User> }> {
    // <-- Usa EntityDTO
    const em = this.userRepository.getEntityManager().fork();

    try {
      // ... (verificación de usuario existente) ...
      const existingUser = await em.getRepository(User).findOne({
        $or: [{ email: data.email! }, { dni: data.dni! }],
      });
      if (existingUser) {
        throw new Error("Usuario ya existe con ese email o DNI");
      }

      // ... (hash de contraseña) ...
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(data.password!, saltRounds);

      const newUser = new User({
        // Crea la entidad
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
        user: wrap(newUser).toObject(), // <-- Usa wrap().toObject()
      };
    } catch (error) {
      throw error;
    }
  }

  async login(
    data: LoginData
  ): Promise<{ token: string; user: EntityDTO<User> }> {
    // <-- Usa EntityDTO
    const em = this.userRepository.getEntityManager().fork();

    try {
      const user = await em.getRepository(User).findOne({ email: data.email });
      if (!user) {
        throw new Error("Credenciales inválidas.");
      }

      const isPasswordValid = await bcrypt.compare(
        data.password,
        user.password
      );
      if (!isPasswordValid) {
        throw new Error("Credenciales inválidas.");
      }

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
        user: wrap(user).toObject(), // <-- Usa wrap().toObject()
      };
    } catch (error) {
      throw error;
    }
  }

  // ... (verifyToken se mantiene igual) ...
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
