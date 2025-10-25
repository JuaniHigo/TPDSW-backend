// src/services/UserService.ts
import { EntityManager, wrap, EntityDTO } from "@mikro-orm/core"; // <-- Importa EntityDTO y wrap
import { Database } from "../config/database.js";
import { User } from "../entities/User.entity.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { NotFoundError } from "../utils/errors.js";

export class UserService {
  private em: EntityManager;
  private userRepository: UserRepository;

  constructor() {
    this.em = Database.getEM();
    this.userRepository = this.em.getRepository(User) as UserRepository;
  }

  async getAllUsers(): Promise<EntityDTO<User>[]> {
    // <-- Usa EntityDTO
    const users = await this.userRepository.findAll({
      // Quita el { fields [...] }
      // MikroORM automáticamente excluye campos hidden:true al serializar
    });
    // Mapea a DTOs para excluir la contraseña correctamente
    return users.map((u) => wrap(u).toObject());
  }

  async getUserById(id: number): Promise<EntityDTO<User> | null> {
    // <-- Usa EntityDTO
    const user = await this.userRepository.findOne({ id });
    return user ? wrap(user).toObject() : null; // Excluye pass al retornar
  }

  async updateUser(id: number, data: Partial<User>): Promise<EntityDTO<User>> {
    // <-- Usa EntityDTO
    const user = await this.userRepository.findOne({ id });
    if (!user) {
      throw new NotFoundError("Usuario no encontrado para actualizar");
    }

    const updateData = {
      nombre: data.nombre,
      apellidos: data.apellidos,
      fechaNacimiento: data.fechaNacimiento,
    };
    wrap(user).assign(updateData);
    await this.em.flush();

    return wrap(user).toObject(); // Usa wrap().toObject()
  }

  async deleteUser(id: number): Promise<void> {
    // findOneOrFail lanza error si no lo encuentra
    const user = await this.userRepository.findOneOrFail({ id });
    await this.em.removeAndFlush(user);
  }
}
