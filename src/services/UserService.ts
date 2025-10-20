// src/services/UserService.ts
import { EntityManager, wrap } from "@mikro-orm/core";
import { Database } from "../config/database";
import { User } from "../entities/User.entity";
import { UserRepository } from "../repositories/UserRepository";
import { NotFoundError } from "../utils/errors"; // (Deberías crear un archivo de errores)

export class UserService {
  private em: EntityManager;
  private userRepository: UserRepository;

  constructor() {
    this.em = Database.getEM();
    this.userRepository = this.em.getRepository(User) as UserRepository;
  }

  async getAllUsers(): Promise<Partial<User>[]> {
    // Usamos 'fields' para excluir la contraseña
    return this.userRepository.findAll({
      fields: [
        "id",
        "dni",
        "nombre",
        "apellidos",
        "email",
        "fechaNacimiento",
        "role",
      ],
    });
  }

  async getUserById(id: number): Promise<Partial<User> | null> {
    return this.userRepository.findOne(
      { id },
      {
        fields: [
          "id",
          "dni",
          "nombre",
          "apellidos",
          "email",
          "fechaNacimiento",
          "role",
        ],
      }
    );
  }

  async updateUser(id: number, data: Partial<User>): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ id });
    if (!user) {
      throw new NotFoundError("Usuario no encontrado para actualizar");
    }

    // Usamos wrap.assign() para actualizar solo los campos provistos
    // Nos aseguramos de no actualizar campos sensibles como password o role desde esta ruta
    const updateData = {
      nombre: data.nombre,
      apellidos: data.apellidos,
      fechaNacimiento: data.fechaNacimiento,
    };
    wrap(user).assign(updateData);
    await this.em.flush();

    return user.toJSON(); // Usamos el helper toJSON() de la entidad
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ id });
    if (!user) {
      throw new NotFoundError("Usuario no encontrado para eliminar");
    }
    await this.em.removeAndFlush(user);
  }
}
