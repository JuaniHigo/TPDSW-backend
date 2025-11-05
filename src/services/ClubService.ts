<<<<<<< Updated upstream
=======
import { EntityManager, wrap } from "@mikro-orm/core";
import { Database } from "../config/database.js";
import { Club } from "../entities/Club.entity.js";
import { ClubRepository } from "../repositories/ClubRepository.js"; // Importa el Repo si existe
import { NotFoundError } from "../utils/errors.js";

// ... (interface PaginationResult)

export class ClubService {
  private em: EntityManager;
  // 1. Declara (usa el tipo específico si tienes repo custom)
  private clubRepository: ClubRepository;

  constructor() {
    this.em = Database.getEM();
    // 2. Inicializa (castea al tipo específico si es necesario)
    this.clubRepository = this.em.getRepository(Club) as ClubRepository;
  }

  // Cambiado: getAllClubs -> getAllClubes para coincidir con el controller
  async getAllClubes(
    page: number,
    limit: number
  ): Promise<PaginationResult<Club>> {
    const offset = (page - 1) * limit;
    const [clubes, total] = await this.clubRepository.findAndCount(
      {},
      { limit, offset, orderBy: { nombre: "ASC" } }
    );
    return {
      data: clubes,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getClubById(id: number): Promise<Club> {
    const club = await this.clubRepository.findOne({ id });
    if (!club) {
      throw new NotFoundError("Club no encontrado");
    }
    return club;
  }

  async createClub(
    data: Omit<
      Club,
      | "id"
      | "socios"
      | "eventosLocales"
      | "eventosVisitante"
      | "createdAt"
      | "updatedAt"
      | "getProximoNumeroSocio"
    >
  ): Promise<Club> {
    // Validar duplicados
    const existing = await this.clubRepository.findOne({
      $or: [{ nombre: data.nombre }, { prefijo: data.prefijo }],
    });
    if (existing) {
      throw new Error("El nombre o prefijo del club ya existe.");
    }

    const newClub = this.em.create(Club, data);
    await this.em.persistAndFlush(newClub);
    return newClub;
  }

  async updateClub(id: number, data: Partial<Club>): Promise<Club> {
    const club = await this.getClubById(id);
    // Excluye campos que no deberían actualizarse masivamente
    const {
      id: _,
      socios,
      eventosLocales,
      eventosVisitante,
      createdAt,
      updatedAt,
      ...updateData
    } = data;
    wrap(club).assign(updateData);
    await this.em.flush();
    return club;
  }

  async deleteClub(id: number): Promise<void> {
    const club = await this.getClubById(id);
    await this.em.removeAndFlush(club);
  }
}
>>>>>>> Stashed changes
