// src/services/TipoEntradaService.ts
import { EntityManager, wrap } from "@mikro-orm/core";
import { Database } from "../config/database";
import { TipoEntrada } from "../entities/TipoEntrada.entity";
import { NotFoundError } from "../utils/errors";

export class TipoEntradaService {
  private em: EntityManager;
  private tipoEntradaRepository = this.em.getRepository(TipoEntrada);

  constructor() {
    this.em = Database.getEM();
  }

  async getAllTipoEntradas(): Promise<TipoEntrada[]> {
    return this.tipoEntradaRepository.findAll();
  }

  async getTipoEntradaById(id: number): Promise<TipoEntrada> {
    const tipoEntrada = await this.tipoEntradaRepository.findOne({ id });
    if (!tipoEntrada) {
      throw new NotFoundError("Tipo de entrada no encontrado");
    }
    return tipoEntrada;
  }

  async createTipoEntrada(data: Omit<TipoEntrada, "id">): Promise<TipoEntrada> {
    // Validar duplicado
    const existing = await this.tipoEntradaRepository.findOne({
      nombre: data.nombre,
    });
    if (existing) {
      throw new Error("El tipo de entrada ya existe.");
    }

    const newTipoEntrada = this.em.create(TipoEntrada, data);
    await this.em.persistAndFlush(newTipoEntrada);
    return newTipoEntrada;
  }

  async updateTipoEntrada(
    id: number,
    data: Partial<TipoEntrada>
  ): Promise<TipoEntrada> {
    const tipoEntrada = await this.getTipoEntradaById(id);
    wrap(tipoEntrada).assign(data);
    await this.em.flush();
    return tipoEntrada;
  }

  async deleteTipoEntrada(id: number): Promise<void> {
    const tipoEntrada = await this.getTipoEntradaById(id);
    await this.em.removeAndFlush(tipoEntrada);
  }
}
