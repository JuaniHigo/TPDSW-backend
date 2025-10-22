// src/repositories/SocioRepository.ts
import { EntityRepository } from "@mikro-orm/mysql";
import { Socio } from "../entities/Socio.entity.js";

export class SocioRepository extends EntityRepository<Socio> {
  async findByUsuarioAndClub(
    usuarioId: number,
    clubId: number
  ): Promise<Socio | null> {
    return this.findOne(
      {
        usuario: usuarioId,
        club: clubId,
      },
      { populate: ["usuario", "club"] }
    );
  }

  async findByUsuario(usuarioId: number): Promise<Socio[]> {
    return this.find({ usuario: usuarioId }, { populate: ["club"] });
  }

  async findByClub(clubId: number): Promise<Socio[]> {
    return this.find({ club: clubId }, { populate: ["usuario"] });
  }

  async existsBetweenUserAndClub(
    usuarioId: number,
    clubId: number
  ): Promise<boolean> {
    const count = await this.count({
      usuario: usuarioId,
      club: clubId,
    });
    return count > 0;
  }
}
