// src/services/EstadioService.ts
import { EntityManager, wrap } from "@mikro-orm/core";
import { Database } from "../config/database";
import { Estadio } from "../entities/Estadio.entity";
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

export class EstadioService {
  private em: EntityManager;
  private estadioRepository = this.em.getRepository(Estadio);

  constructor() {
    this.em = Database.getEM();
  }

  async getAllEstadios(
    page: number,
    limit: number
  ): Promise<PaginationResult<Estadio>> {
    const offset = (page - 1) * limit;
    const [estadios, total] = await this.estadioRepository.findAndCount(
      {},
      {
        limit,
        offset,
        orderBy: { nombre: "ASC" },
      }
    );

    return {
      data: estadios,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEstadioById(id: number): Promise<Estadio> {
    const estadio = await this.estadioRepository.findOne({ id });
    if (!estadio) {
      throw new NotFoundError("Estadio no encontrado");
    }
    return estadio;
  }

  async createEstadio(data: Omit<Estadio, "id">): Promise<Estadio> {
    const newEstadio = this.em.create(Estadio, data);
    await this.em.persistAndFlush(newEstadio);
    return newEstadio;
  }

  async updateEstadio(id: number, data: Partial<Estadio>): Promise<Estadio> {
    const estadio = await this.getEstadioById(id);
    wrap(estadio).assign(data);
    await this.em.flush();
    return estadio;
  }

  async deleteEstadio(id: number): Promise<void> {
    const estadio = await this.getEstadioById(id);
    await this.em.removeAndFlush(estadio);
  }
}
