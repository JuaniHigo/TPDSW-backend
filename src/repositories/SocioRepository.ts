// src/repositories/SocioRepository.ts
import { EntityRepository } from "@mikro-orm/mysql";
import { Socio } from "../entities/Socio.entity";

export class SocioRepository extends EntityRepository<Socio> {
  async findByUsuarioAndClub(
    usuarioId: number,
    clubId: number
  ): Promise<Socio | null> {
    return this.findOne(
      {
        fkIdUsuario: usuarioId,
        fkIdClub: clubId,
      },
      { populate: ["usuario", "club"] }
    );
  }

  async findByUsuario(usuarioId: number): Promise<Socio[]> {
    return this.find({ fkIdUsuario: usuarioId }, { populate: ["club"] });
  }

  async findByClub(clubId: number): Promise<Socio[]> {
    return this.find({ fkIdClub: clubId }, { populate: ["usuario"] });
  }

  async existsBetweenUserAndClub(
    usuarioId: number,
    clubId: number
  ): Promise<boolean> {
    const count = await this.count({
      fkIdUsuario: usuarioId,
      fkIdClub: clubId,
    });
    return count > 0;
  }
}
