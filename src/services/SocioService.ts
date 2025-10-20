// src/services/SocioService.ts
import { EntityManager, wrap } from "@mikro-orm/core";
import { Database } from "../config/database";
import { Socio } from "../entities/Socio.entity";
import { SocioRepository } from "../repositories/SocioRepository";
import { UserRepository } from "../repositories/UserRepository";
import { ClubRepository } from "../repositories/ClubRepository";
import { User } from "../entities/User.entity";
import { Club } from "../entities/Club.entity";
import { NotFoundError } from "../utils/errors";

interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class SocioService {
  private em: EntityManager;
  private socioRepository: SocioRepository;

  constructor() {
    this.em = Database.getEM();
    this.socioRepository = this.em.getRepository(Socio) as SocioRepository;
  }

  async createSocio(fkIdUsuario: number, fkIdClub: number): Promise<Socio> {
    return this.em.transactional(async (em) => {
      const socioRepo = em.getRepository(Socio) as SocioRepository;

      // 1. Validar que usuario y club existan
      const usuario = await em.findOne(User, { id: fkIdUsuario });
      if (!usuario) throw new NotFoundError("Usuario no encontrado");

      const club = await em.findOne(Club, { id: fkIdClub });
      if (!club) throw new NotFoundError("Club no encontrado");

      // 2. Validar que no sea socio ya
      const existing = await socioRepo.existsBetweenUserAndClub(
        fkIdUsuario,
        fkIdClub
      );
      if (existing) {
        throw new Error("El usuario ya es socio de ese club.");
      }

      // 3. Contar socios para generar número (usando el repositorio de Club)
      const clubRepo = em.getRepository(Club) as ClubRepository;
      const nro_socio_generado = await clubRepo.getProximoNumeroSocio(fkIdClub);

      // 4. Crear socio
      const newSocio = em.create(Socio, {
        fkIdUsuario,
        fkIdClub,
        nroSocio: nro_socio_generado,
        fechaAsociacion: new Date(),
        usuario: usuario, // Asignamos las relaciones
        club: club,
      });

      await em.persistAndFlush(newSocio);
      return newSocio;
    });
  }

  async getAllSocios(
    page: number,
    limit: number
  ): Promise<PaginationResult<Socio>> {
    const offset = (page - 1) * limit;
    const [socios, total] = await this.socioRepository.findAndCount(
      {},
      {
        limit,
        offset,
        populate: ["usuario", "club"],
        orderBy: { fechaAsociacion: "DESC" },
      }
    );

    return {
      data: socios,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSocioById(fkIdUsuario: number, fkIdClub: number): Promise<Socio> {
    const socio = await this.socioRepository.findByUsuarioAndClub(
      fkIdUsuario,
      fkIdClub
    );
    if (!socio) {
      throw new NotFoundError("Socio no encontrado");
    }
    return socio;
  }

  async updateSocio(
    fkIdUsuario: number,
    fkIdClub: number,
    data: Partial<Socio>
  ): Promise<Socio> {
    const socio = await this.getSocioById(fkIdUsuario, fkIdClub);
    // Solo permitimos actualizar el nroSocio, por ejemplo
    wrap(socio).assign({ nroSocio: data.nroSocio });
    await this.em.flush();
    return socio;
  }

  async deleteSocio(fkIdUsuario: number, fkIdClub: number): Promise<void> {
    const socio = await this.getSocioById(fkIdUsuario, fkIdClub);
    await this.em.removeAndFlush(socio);
  }
}
