// src/entities/PrecioEventoSector.entity.ts
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  PrimaryKeyProp, // <-- 1. Import PrimaryKeyProp
} from "@mikro-orm/core";
// --- CORRECCIÓN: Imports movidos al inicio ---
import { Evento } from "./Evento.entity.js";
import { Sector } from "./Sector.entity.js";
// --- FIN CORRECCIÓN ---

@Entity({ tableName: "precios_evento_sector" })
export class PrecioEventoSector {
  // --- CORRECCIÓN: Borramos las @PrimaryKey duplicadas ---
  /*
  @PrimaryKey({ fieldName: "fk_id_evento" })
  fkIdEvento!: number;

  @PrimaryKey({ fieldName: "fk_id_sector" })
  fkIdSector!: number;
  */
  // --- FIN CORRECCIÓN ---

  @Property({ type: "decimal", precision: 10, scale: 2 })
  precio!: number;

  // --- 2. Agregamos esto para definir el tipo de la PK compuesta ---
  [PrimaryKeyProp]?: [number, number];

  // Relaciones (Estas son las definiciones correctas de la PK)
  @ManyToOne(() => Evento, { fieldName: "fk_id_evento", primary: true })
  evento!: Evento;

  @ManyToOne(() => Sector, { fieldName: "fk_id_sector", primary: true })
  sector!: Sector;

  constructor(data: Partial<PrecioEventoSector> = {}) {
    Object.assign(this, data);
  }
}