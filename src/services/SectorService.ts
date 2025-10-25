// src/services/SectorService.ts
import { EntityManager, wrap } from "@mikro-orm/core";
import { Database } from "../config/database.js";
import { Sector } from "../entities/Sector.entity.js";
import { Estadio } from "../entities/Estadio.entity.js"; // Importamos Estadio para la referencia
import { NotFoundError } from "../utils/errors.js";

// ... (interface PaginationResult)

// --- Tipos para datos de entrada ---
export interface CreateSectorData {
  idSector: number; // La PK es necesaria al crear con claves compuestas explícitas
  estadio: number; // El ID del estadio
  nombreSector: string;
  capacidad: number;
}
export type UpdateSectorData = Partial<
  Omit<CreateSectorData, "idSector" | "estadio">
> & { estadio?: number };
// --- Fin Tipos ---

export class SectorService {
  private em: EntityManager;
  // 1. Declara
  private sectorRepository;

  constructor() {
    this.em = Database.getEM();
    // 2. Inicializa
    this.sectorRepository = this.em.getRepository(Sector);
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
        populate: ["estadio"], // Popula la relación
        orderBy: { estadio: "ASC", nombreSector: "ASC" }, // Ordena por relación y nombre
      }
    );
    // ... (retorna el resultado paginado)
    return {
      data: sectores,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSectorById(idSector: number, idEstadio: number): Promise<Sector> {
    const sector = await this.sectorRepository.findOne(
      {
        idSector: idSector,
        estadio: idEstadio, // Filtra por la relación usando el ID
      },
      { populate: ["estadio"] }
    ); // Popula si necesitas los datos del estadio

    if (!sector) {
      throw new NotFoundError(
        `Sector no encontrado con ID ${idSector} en Estadio ${idEstadio}`
      );
    }
    return sector;
  }

  async createSector(data: CreateSectorData): Promise<Sector> {
    // Validar que el estadio exista
    const estadioRef = this.em.getReference(Estadio, data.estadio); // Obtiene una referencia

    // Crea la entidad pasando las partes de la PK y el resto
    const newSector = this.em.create(Sector, {
      idSector: data.idSector,
      estadio: estadioRef, // Usa la referencia
      nombreSector: data.nombreSector,
      capacidad: data.capacidad,
    });

    // Verifica si ya existe (opcional pero recomendado)
    const existing = await this.sectorRepository.findOne({
      idSector: data.idSector,
      estadio: data.estadio,
    });
    if (existing) {
      throw new Error(
        `El sector ${data.idSector} ya existe en el estadio ${data.estadio}`
      );
    }

    await this.em.persistAndFlush(newSector);
    return newSector;
  }

  async updateSector(
    idSector: number,
    idEstadio: number,
    data: UpdateSectorData
  ): Promise<Sector> {
    const sector = await this.getSectorById(idSector, idEstadio);

    // Separamos 'estadio' (ID) del resto
    const { estadio: newEstadioId, ...restOfData } = data;

    // Asignamos datos simples
    wrap(sector).assign(restOfData);

    // Si se pasa un nuevo ID de estadio, actualizamos la referencia
    if (newEstadioId && newEstadioId !== sector.estadio.id) {
      // ¡Ojo! Cambiar la parte de una PK compuesta es complejo y usualmente no se hace.
      // Requeriría borrar y crear uno nuevo o una lógica de BD más avanzada.
      // Por ahora, lanzaremos un error si se intenta.
      throw new Error("No se puede cambiar el estadio de un sector existente.");
      // Si realmente necesitas hacerlo:
      // sector.estadio = this.em.getReference(Estadio, newEstadioId);
    }

    await this.em.flush();
    return sector;
  }

  async deleteSector(idSector: number, idEstadio: number): Promise<void> {
    const sector = await this.getSectorById(idSector, idEstadio);
    await this.em.removeAndFlush(sector);
  }
}
