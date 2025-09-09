// src/entities/PrecioEventoSector.entity.ts
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  PrimaryKeyType,
} from "@mikro-orm/core";
import { Evento } from "./Evento.entity";
import { Sector } from "./Sector.entity";

@Entity({ tableName: "precios_evento_sector" })
export class PrecioEventoSector {
  @PrimaryKey({ fieldName: "fk_id_evento" })
  fkIdEvento!: number;

  @PrimaryKey({ fieldName: "fk_id_sector" })
  fkIdSector!: number;

  @Property({ type: "decimal", precision: 10, scale: 2 })
  precio!: number;

  [PrimaryKeyType]?: [number, number];

  // Relaciones
  @ManyToOne(() => Evento, { fieldName: "fk_id_evento", primary: true })
  evento!: Evento;

  @ManyToOne(() => Sector, { fieldName: "fk_id_sector", primary: true })
  sector!: Sector;

  constructor(data: Partial<PrecioEventoSector> = {}) {
    Object.assign(this, data);
  }
}
