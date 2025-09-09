//src/repositories/EventoRepository.ts
import { EntityRepository, QueryOrderMap } from "@mikro-orm/mysql";
import { Evento, EstadoEvento } from "../entities/Evento.entity";

export class EventoRepository extends EntityRepository<Evento> {
  async findWithDetails(id: number): Promise<Evento | null> {
    return this.findOne(
      { id },
      {
        populate: ["clubLocal", "clubVisitante", "estadio"],
      }
    );
  }

  async findAllWithDetails(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const [eventos, total] = await this.findAndCount(
      {},
      {
        populate: ["clubLocal", "clubVisitante", "estadio"],
        orderBy: { fechaHora: QueryOrder.DESC },
        limit,
        offset,
      }
    );

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
      {
        populate: ["clubLocal", "clubVisitante", "estadio"],
      }
    );
  }

  async findByClub(clubId: number): Promise<Evento[]> {
    return this.find(
      {
        $or: [{ fkIdClubLocal: clubId }, { fkIdClubVisitante: clubId }],
      },
      { populate: ["clubLocal", "clubVisitante", "estadio"] }
    );
  }
}
