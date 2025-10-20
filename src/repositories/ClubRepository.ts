// src/repositories/ClubRepository.ts
import { EntityRepository } from "@mikro-orm/mysql";
import { Club } from "../entities/Club.entity";

export class ClubRepository extends EntityRepository<Club> {
  async findByPrefijo(prefijo: string): Promise<Club | null> {
    return this.findOne({ prefijo });
  }

  async findWithSocios(id: number): Promise<Club | null> {
    return this.findOne({ id }, { populate: ["socios"] });
  }

  async getProximoNumeroSocio(clubId: number): Promise<string> {
    const club = await this.findOneOrFail(clubId);
    const totalSocios = await this.em.count(socio, { club: clubId });
    return `${club.prefijo}-${totalSocios + 1}`;
  }
}
