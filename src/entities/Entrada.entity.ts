// src/entities/Entrada.entity.ts
import { Entity, PrimaryKey, Property, ManyToOne } from "@mikro-orm/core";
import { Compra } from "./Compra.entity";
import { Evento } from "./Evento.entity";
import { Sector } from "./Sector.entity";

@Entity({ tableName: "entradas" })
export class Entrada {
  @PrimaryKey({ fieldName: "id_entrada" })
  id!: number;

  @Property({ fieldName: "fk_id_compra" })
  fkIdCompra!: number;

  @Property({ fieldName: "fk_id_evento" })
  fkIdEvento!: number;

  @Property({ fieldName: "fk_id_sector" })
  fkIdSector!: number;

  @Property({ fieldName: "codigo_qr", type: "text" })
  codigoQr!: string;

  @Property({ nullable: true })
  utilizada?: boolean;

  @Property({ fieldName: "fecha_utilizacion", nullable: true })
  fechaUtilizacion?: Date;

  @Property({ fieldName: "created_at", defaultRaw: "CURRENT_TIMESTAMP" })
  createdAt: Date = new Date();

  // Relaciones
  @ManyToOne(() => Compra, { fieldName: "fk_id_compra" })
  compra!: Compra;

  @ManyToOne(() => Evento, { fieldName: "fk_id_evento" })
  evento!: Evento;

  @ManyToOne(() => Sector, { fieldName: "fk_id_sector" })
  sector!: Sector;

  constructor(data: Partial<Entrada> = {}) {
    Object.assign(this, data);
  }
}
