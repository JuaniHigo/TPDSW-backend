// src/services/EventoService.ts
import { Database } from "../config/database";
import { Evento } from "../entities/Evento.entity";
import { EventoRepository } from "../repositories/EventoRepository";
import { EntityManager } from "@mikro-orm/mysql";

export class EventoService {
  private em: EntityManager;
  private eventoRepository: EventoRepository;

  constructor() {
    this.em = Database.getEM();
    // Asegúrate que tu EventoRepository esté correctamente asignado en la entidad Evento
    // @Entity({ repository: () => EventoRepository, ... })
    this.eventoRepository = this.em.getRepository(Evento) as EventoRepository;
  }

  async getAllEventos(page: number, limit: number) {
    // Usamos el método personalizado del repositorio que ya tenías
    return this.eventoRepository.findAllWithDetails(page, limit);
  }

  async getEventoById(id: number): Promise<Evento | null> {
    // Usamos el método personalizado del repositorio
    const evento = await this.eventoRepository.findWithDetails(id);
    return evento;
  }

  // Aquí irían los métodos create, update y delete, usando em.persist(), em.flush(), etc.
}
