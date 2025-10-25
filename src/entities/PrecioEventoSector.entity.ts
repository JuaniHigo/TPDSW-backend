// src/entities/PrecioEventoSector.entity.ts
import {
  Entity,
  Property,
  ManyToOne,
  PrimaryKeyProp, // <-- Importa PrimaryKeyProp
} from "@mikro-orm/core";
import { Evento } from "./Evento.entity.js";
import { Sector } from "./Sector.entity.js";

@Entity({ tableName: "precios_evento_sector" })
export class PrecioEventoSector {
  // --- Propiedades FK eliminadas ---

  @Property({ type: "decimal", precision: 10, scale: 2 })
  precio!: number;

  // --- Definición de la Clave Compuesta ---
  [PrimaryKeyProp]?: ["evento", "sector"]; // Usa los nombres de las PROPIEDADES de relación

  // Relaciones (Estas son las Primary Keys)
  @ManyToOne(() => Evento, {
    fieldName: "fk_id_evento",
    primary: true,
    onDelete: "cascade",
  })
  evento!: Evento;

  @ManyToOne(() => Sector, {
    fieldName: "fk_id_sector",
    primary: true,
    onDelete: "cascade",
  })
  sector!: Sector;
  // --- Fin Definición Clave Compuesta ---

  constructor(data: Partial<PrecioEventoSector> = {}) {
    Object.assign(this, data);
  }
}
