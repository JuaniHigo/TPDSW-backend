// src/services/ClubService.ts
import { EntityManager, wrap } from "@mikro-orm/core";
import { Database } from "../config/database.js";
import { Club } from "../entities/Club.entity.js"; // <-- Importa la entidad Club
import { NotFoundError } from "../utils/errors.js";

// Esta interfaz genérica la puedes reutilizar
interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ClubService {
  private em: EntityManager;
  // Apunta al repositorio de Club
  private clubRepository; 

  constructor() {
    this.em = Database.getEM();
    this.clubRepository = this.em.getRepository(Club);
  }

  async getAllClubs(
    page: number,
    limit: number
  ): Promise<PaginationResult<Club>> {
    const offset = (page - 1) * limit;
    // Cambia 'estadios' por 'clubs'
    const [clubs, total] = await this.clubRepository.findAndCount(
      {},
      {
        limit,
        offset,
        orderBy: { nombre: "ASC" }, // Asumo que Club también tiene un campo 'nombre'
      }
    );

    return {
      data: clubs, // Retorna 'clubs'
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getClubById(id: number): Promise<Club> {
    const club = await this.clubRepository.findOne({ id });
    if (!club) {
      throw new NotFoundError("Club no encontrado"); // Mensaje de error actualizado
    }
    return club;
  }

  // Asumo que la data para crear un club es similar (omitiendo el id)
  async createClub(data: Omit<Club, "id">): Promise<Club> {
    const newClub = this.em.create(Club, data); // Crea un Club
    await this.em.persistAndFlush(newClub);
    return newClub;
  }

  async updateClub(id: number, data: Partial<Club>): Promise<Club> {
    const club = await this.getClubById(id); // Usa el método local
    wrap(club).assign(data);
    await this.em.flush();
    return club;
  }

  async deleteClub(id: number): Promise<void> {
    const club = await this.getClubById(id); // Usa el método local
    await this.em.removeAndFlush(club);
  }
}