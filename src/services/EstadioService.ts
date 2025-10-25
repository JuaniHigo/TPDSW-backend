// src/services/EstadioService.ts
import { EntityManager, wrap } from "@mikro-orm/core";
import { Database } from "../config/database.js";
import { Estadio } from "../entities/Estadio.entity.js";
import { NotFoundError } from "../utils/errors.js";

// ... (interface PaginationResult)

export class EstadioService {
  private em: EntityManager;
  // 1. Declara la propiedad aquí
  private estadioRepository;

  constructor() {
    this.em = Database.getEM();
    // 2. Inicialízala AQUÍ
    this.estadioRepository = this.em.getRepository(Estadio);
  }

  // ... (resto de los métodos como estaban, usando this.estadioRepository)
  async getAllEstadios(
    page: number,
    limit: number
  ): Promise<PaginationResult<Estadio>> {
    /* ... */
  }
  async getEstadioById(id: number): Promise<Estadio> {
    /* ... */
  }
  async createEstadio(data: Omit<Estadio, "id">): Promise<Estadio> {
    /* ... */
  }
  async updateEstadio(id: number, data: Partial<Estadio>): Promise<Estadio> {
    /* ... */
  }
  async deleteEstadio(id: number): Promise<void> {
    /* ... */
  }
}
