// src/entities/Entrada.entity.ts
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne, // Quitamos JoinColumns, etc.
} from "@mikro-orm/core";
import { Compra } from "./Compra.entity.js";
import { Evento } from "./Evento.entity.js";
import { Sector } from "./Sector.entity.js";
import { Estadio } from "./Estadio.entity.js"; // Necesitamos Estadio para la referencia

@Entity({ tableName: "entradas" })
export class Entrada {
  @PrimaryKey({ fieldName: "id_entrada" })
  id!: number;

  // --- Propiedades FK eliminadas ---

  @Property({ fieldName: "codigo_qr", type: "text" })
  codigoQr!: string;

  @Property({ nullable: true, default: false })
  utilizada?: boolean = false;

  @Property({
    fieldName: "fecha_utilizacion",
    nullable: true,
    type: "datetime",
  })
  fechaUtilizacion?: Date;

  @Property({ fieldName: "created_at", defaultRaw: "CURRENT_TIMESTAMP" })
  createdAt: Date = new Date();

  // Relaciones
  @ManyToOne({
    entity: () => Compra,
    fieldName: "fk_id_compra",
    onDelete: "cascade",
  })
  compra!: Compra;

  @ManyToOne({
    entity: () => Evento,
    fieldName: "fk_id_evento",
    onDelete: "cascade",
  })
  evento!: Evento;

  // --- Relación con Sector (Clave Compuesta) ---
  @ManyToOne({
    entity: () => Sector,
    // Columnas en ESTA tabla (Entrada) que apuntan a Sector
    fieldNames: ["fk_id_sector", "fk_id_estadio"],
    // Columnas PK en la tabla Sector
    referencedColumnNames: ["id_sector", "fk_id_estadio"],
    onDelete: "cascade",
  })
  sector!: Sector;
  // --- Fin Relación ---

  constructor(data: Partial<Entrada> = {}) {
    Object.assign(this, data);
  }
}
