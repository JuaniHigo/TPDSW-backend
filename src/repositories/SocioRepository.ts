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
        usuario: usuarioId, // <-- Usa la propiedad de relación
        club: clubId, // <-- Usa la propiedad de relación
      },
      { populate: ["usuario", "club"] }
    );
  }

  async findByUsuario(usuarioId: number): Promise<Socio[]> {
    return this.find({ usuario: usuarioId }, { populate: ["club"] }); // <-- Usa la relación
  }

  async findByClub(clubId: number): Promise<Socio[]> {
    return this.find({ club: clubId }, { populate: ["usuario"] }); // <-- Usa la relación
  }

  async existsBetweenUserAndClub(
    usuarioId: number,
    clubId: number
  ): Promise<boolean> {
    const count = await this.count({
      usuario: usuarioId, // <-- Usa la relación
      club: clubId, // <-- Usa la relación
    });
    return count > 0;
  }
}
