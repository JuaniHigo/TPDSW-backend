// src/services/TipoEntradaService.ts
import { EntityManager, wrap } from "@mikro-orm/core";
import { Database } from "../config/database.js";
import { TipoEntrada } from "../entities/TipoEntrada.entity.js";
import { NotFoundError } from "../utils/errors.js";

export class TipoEntradaService {
  private em: EntityManager;
  // 1. Declara
  private tipoEntradaRepository;

  constructor() {
    this.em = Database.getEM();
    // 2. Inicializa
    this.tipoEntradaRepository = this.em.getRepository(TipoEntrada);
  }

  // ... (resto de los métodos como estaban, usando this.tipoEntradaRepository)
  async getAllTipoEntradas(): Promise<TipoEntrada[]> {
    /* ... */
  }
  async getTipoEntradaById(id: number): Promise<TipoEntrada> {
    /* ... */
  }
  async createTipoEntrada(data: Omit<TipoEntrada, "id">): Promise<TipoEntrada> {
    /* ... */
  }
  async updateTipoEntrada(
    id: number,
    data: Partial<TipoEntrada>
  ): Promise<TipoEntrada> {
    /* ... */
  }
  async deleteTipoEntrada(id: number): Promise<void> {
    /* ... */
  }
}
