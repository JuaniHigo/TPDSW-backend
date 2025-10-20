// src/entities/Evento.entity.ts
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  Enum,
} from "@mikro-orm/core";
import { Club } from "./Club.entity";
import { Estadio } from "./Estadio.entity";
import { Entrada } from "./Entrada.entity";
import { PrecioEventoSector } from "./PrecioEventoSector.entity";
import { EventoRepository } from "../repositories/EventoRepository";

export enum EstadoEvento {
  PROGRAMADO = "Programado",
  EN_VENTA = "En Venta",
  FINALIZADO = "Finalizado",
  CANCELADO = "Cancelado",
}

@Entity({ tableName: "eventos", repository: () => EventoRepository })
export class Evento {
  @PrimaryKey({ fieldName: "id_evento" })
  id!: number;

  @Property({ fieldName: "fk_id_club_local" })
  fkIdClubLocal!: number;

  @Property({ fieldName: "fk_id_club_visitante" })
  fkIdClubVisitante!: number;

  @Property({ fieldName: "fk_id_estadio" })
  fkIdEstadio!: number;

  @Property({ fieldName: "fecha_hora" })
  fechaHora!: Date;

  @Property({ length: 100 })
  torneo!: string;

  @Enum({ items: () => EstadoEvento, default: EstadoEvento.PROGRAMADO })
  estado: EstadoEvento = EstadoEvento.PROGRAMADO;

  @Property({ fieldName: "solo_publico_local", default: false })
  soloPublicoLocal: boolean = false;

  @Property({ fieldName: "created_at", defaultRaw: "CURRENT_TIMESTAMP" })
  createdAt: Date = new Date();

  @Property({
    fieldName: "updated_at",
    defaultRaw: "CURRENT_TIMESTAMP",
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();

  // Relaciones
  @ManyToOne(() => Club, { fieldName: "fk_id_club_local" })
  clubLocal!: Club;

  @ManyToOne(() => Club, { fieldName: "fk_id_club_visitante" })
  clubVisitante!: Club;

  @ManyToOne(() => Estadio, { fieldName: "fk_id_estadio" })
  estadio!: Estadio;

  @OneToMany(() => Entrada, (entrada) => entrada.evento)
  entradas = new Collection<Entrada>(this);

  @OneToMany(() => PrecioEventoSector, (precio) => precio.evento)
  precios = new Collection<PrecioEventoSector>(this);

  constructor(data: Partial<Evento> = {}) {
    Object.assign(this, data);
  }

  get descripcion(): string {
    return `${this.clubLocal.nombre} vs ${this.clubVisitante.nombre}`;
  }
}
