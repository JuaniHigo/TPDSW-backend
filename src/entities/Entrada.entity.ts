// src/entities/Entrada.entity.ts
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  // Ya no importamos 'JoinColumns' ni 'ReferencedColumnNames'
} from "@mikro-orm/core";
import { Compra } from "./Compra.entity.js";
import { Evento } from "./Evento.entity.js";
import { Sector } from "./Sector.entity.js";

@Entity({ tableName: "entradas" })
export class Entrada {
  @PrimaryKey({ fieldName: "id_entrada" })
  id!: number;

  // --- INICIO DE CORRECCIÓN ---
  // Borramos estas propiedades. Serán manejadas 100% por las relaciones.
  /*
  @Property({ fieldName: "fk_id_compra" })
  fkIdCompra!: number;

  @Property({ fieldName: "fk_id_evento" })
  fkIdEvento!: number;

  @Property({ fieldName: "fk_id_sector" })
  fkIdSector!: number;

  @Property({ fieldName: "fk_id_estadio" })
  fkIdEstadio!: number;
  */
  // --- FIN DE CORRECCIÓN ---

  @Property({ fieldName: "codigo_qr", type: "text" })
  codigoQr!: string;

  @Property({ nullable: true, default: false })
  utilizada?: boolean = false;

  @Property({ fieldName: "fecha_utilizacion", nullable: true })
  fechaUtilizacion?: Date;

  @Property({ fieldName: "created_at", defaultRaw: "CURRENT_TIMESTAMP" })
  createdAt: Date = new Date();

  // Relaciones
  @ManyToOne({ entity: () => Compra, fieldName: "fk_id_compra" })
  compra!: Compra;

  @ManyToOne({ entity: () => Evento, fieldName: "fk_id_evento" })
  evento!: Evento;

  // --- INICIO DE CORRECCIÓN ---
  // Esta es la forma correcta de definir la relación
  // con una clave primaria compuesta, usando las OPCIONES.
  @ManyToOne({
    entity: () => Sector,
    // Las columnas en *esta* tabla (Entrada)
    joinColumns: ["fk_id_sector", "fk_id_estadio"],
    // Las columnas en la tabla *objetivo* (Sector)
    referencedColumnNames: ["id_sector", "fk_id_estadio"],
  })
  sector!: Sector;
  // --- FIN DE CORRECCIÓN ---

  constructor(data: Partial<Entrada> = {}) {
    Object.assign(this, data);
  }
}