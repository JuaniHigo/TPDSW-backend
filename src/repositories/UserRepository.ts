// src/repositories/UserRepository.ts
import { EntityRepository } from "@mikro-orm/mysql";
import { User } from "../entities/User.entity";

export class UserRepository extends EntityRepository<User> {
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async findByDni(dni: string): Promise<User | null> {
    return this.findOne({ dni });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.count({ email });
    return count > 0;
  }

  async findWithSocios(id: number): Promise<User | null> {
    return this.findOne({ id }, { populate: ["socios", "socios.club"] });
  }
}
