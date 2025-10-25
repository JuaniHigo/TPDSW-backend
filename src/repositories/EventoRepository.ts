//src/repositories/EventoRepository.ts
import { EntityRepository, QueryOrder } from "@mikro-orm/mysql"; // Importa QueryOrder
import { Evento, EstadoEvento } from "../entities/Evento.entity.js";

export class EventoRepository extends EntityRepository<Evento> {
  async findWithDetails(id: number): Promise<Evento | null> {
    return this.findOne(
      { id },
      { populate: ["clubLocal", "clubVisitante", "estadio"] }
    );
  }

  async findAllWithDetails(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    const [eventos, total] = await this.findAndCount(
      {},
      {
        populate: ["clubLocal", "clubVisitante", "estadio"],
        orderBy: { fechaHora: QueryOrder.DESC }, // Usa QueryOrder importado
        limit,
        offset,
      }
    );
    // ... (retorna paginación)
    return {
      data: eventos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByEstado(estado: EstadoEvento): Promise<Evento[]> {
    return this.find(
      { estado },
      { populate: ["clubLocal", "clubVisitante", "estadio"] }
    );
  }

  async findByClub(clubId: number): Promise<Evento[]> {
    return this.find(
      {
        $or: [
          { clubLocal: clubId }, // <-- Usa la relación
          { clubVisitante: clubId }, // <-- Usa la relación
        ],
      },
      { populate: ["clubLocal", "clubVisitante", "estadio"] }
    );
  }
}
