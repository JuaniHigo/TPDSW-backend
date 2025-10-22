// src/services/SectorService.ts
import { EntityManager, wrap } from "@mikro-orm/core";
import { Database } from "../config/database.js";
import { Sector } from "../entities/Sector.entity.js";
import { Estadio } from "../entities/Estadio.entity.js"; // Importamos Estadio para la referencia
import { NotFoundError } from "../utils/errors.js";

// Interfaz para paginación (genérica)
interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// --- CORRECCIÓN ---
// Creamos una interfaz para los datos de creación.
// La clave compuesta (idSector, estadio) ES REQUERIDA al crear.
export interface CreateSectorData {
  idSector: number;
  estadio: number; // El ID del estadio
  nombreSector: string;
  capacidad: number;
}

// Para actualizar, todos los campos son opcionales
export type UpdateSectorData = Partial<CreateSectorData>;

export class SectorService {
  private em: EntityManager;
  private sectorRepository;

  constructor() {
    this.em = Database.getEM();
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
        // --- CORRECCIÓN (Línea 38) ---
        // No se usa fkIdEstadio, se usa la propiedad de relación 'estadio'
        orderBy: { estadio: "ASC" },
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

  async getSectorById(idSector: number, idEstadio: number): Promise<Sector> {
    // --- CORRECCIÓN (Línea 56) ---
    // Se filtra por la clave compuesta: 'idSector' y la relación 'estadio'
    const sector = await this.sectorRepository.findOne({
      idSector: idSector,
      estadio: idEstadio,
    });

    if (!sector) {
      throw new NotFoundError("Sector no encontrado");
    }
    return sector;
  }

  async createSector(data: CreateSectorData): Promise<Sector> {
    // --- CORRECCIÓN (Líneas 68 y 74) ---
    // El tipo 'data' ahora es 'CreateSectorData' y SÍ incluye las claves.
    // Pasamos los datos explícitamente al 'create'.
    const newSector = this.em.create(Sector, {
      idSector: data.idSector,
      nombreSector: data.nombreSector,
      capacidad: data.capacidad,
      estadio: data.estadio, // MikroORM entiende que esto es el ID para la relación
    });

    await this.em.persistAndFlush(newSector);
    return newSector;
  }

  async updateSector(
    idSector: number,
    idEstadio: number,
    data: UpdateSectorData
  ): Promise<Sector> {
    const sector = await this.getSectorById(idSector, idEstadio);

    // Separamos 'estadio' del resto de datos
    const { estadio, ...restOfData } = data;

    // Asignamos los datos simples (nombre, capacidad)
    wrap(sector).assign(restOfData);

    // Si el 'estadio' (ID) viene en los datos, lo actualizamos como referencia
    if (estadio) {
      sector.estadio = this.em.getReference(Estadio, estadio);
    }

    await this.em.flush();
    return sector;
  }

  async deleteSector(idSector: number, idEstadio: number): Promise<void> {
    // Usamos el método local para encontrar por clave compuesta
    const sector = await this.getSectorById(idSector, idEstadio);
    await this.em.removeAndFlush(sector);
  }
}