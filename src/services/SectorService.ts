// src/services/SectorService.ts
import { EntityManager, wrap } from "@mikro-orm/core";
import { Database } from "../config/database";
import { Sector } from "../entities/Sector.entity";
import { NotFoundError } from "../utils/errors";
import { Estadio } from "../entities/Estadio.entity";

interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class SectorService {
  private em: EntityManager;
  private sectorRepository = this.em.getRepository(Sector);

  constructor() {
    this.em = Database.getEM();
  }

  async getAllSectores(
    page: number,
    limit: number
  ): Promise<PaginationResult<Sector>> {
    const offset = (page - 1) * limit;
    const [sectores, total] = await this.sectorRepository.findAndCount(
      {},
      {
        limit,
        offset,
        populate: ["estadio"],
        orderBy: { fkIdEstadio: "ASC", nombreSector: "ASC" },
      }
    );

    return {
      data: sectores,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSectorById(idSector: number, fkIdEstadio: number): Promise<Sector> {
    const sector = await this.sectorRepository.findOne({
      idSector,
      fkIdEstadio,
    });
    if (!sector) {
      throw new NotFoundError("Sector no encontrado");
    }
    return sector;
  }

  async createSector(
    data: Omit<Sector, "idSector" | "estadio">
  ): Promise<Sector> {
    // Validar que el estadio exista
    const estadio = await this.em.findOne(Estadio, { id: data.fkIdEstadio });
    if (!estadio) {
      throw new NotFoundError("El estadio especificado no existe");
    }

    // MikroORM es lo suficientemente inteligente para manejar la FK
    const newSector = this.em.create(Sector, data);
    await this.em.persistAndFlush(newSector);
    return newSector;
  }

  async updateSector(
    idSector: number,
    fkIdEstadio: number,
    data: Partial<Sector>
  ): Promise<Sector> {
    const sector = await this.getSectorById(idSector, fkIdEstadio);
    wrap(sector).assign(data);
    await this.em.flush();
    return sector;
  }

  async deleteSector(idSector: number, fkIdEstadio: number): Promise<void> {
    const sector = await this.getSectorById(idSector, fkIdEstadio);
    await this.em.removeAndFlush(sector);
  }
}
