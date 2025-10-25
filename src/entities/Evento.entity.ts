// src/entities/Evento.entity.ts
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  Enum,
  wrap, // Importa wrap
} from "@mikro-orm/core";
import { Club } from "./Club.entity.js";
import { Estadio } from "./Estadio.entity.js";
import { Entrada } from "./Entrada.entity.js";
import { PrecioEventoSector } from "./PrecioEventoSector.entity.js";
import { EventoRepository } from "../repositories/EventoRepository.js";

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

  // --- Propiedades FK eliminadas ---

  @Property({ fieldName: "fecha_hora", type: "datetime" }) // type: 'datetime' es más explícito
  fechaHora!: Date;

  @Property({ length: 100 })
  torneo!: string;

  @Enum(() => EstadoEvento) // Separado
  @Property({ default: EstadoEvento.PROGRAMADO }) // Separado
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

  // Relaciones (Correctas)
  @ManyToOne(() => Club, { fieldName: "fk_id_club_local", onDelete: "cascade" }) // onDelete opcional
  clubLocal!: Club;

  @ManyToOne(() => Club, {
    fieldName: "fk_id_club_visitante",
    onDelete: "cascade",
  }) // onDelete opcional
  clubVisitante!: Club;

  @ManyToOne(() => Estadio, { fieldName: "fk_id_estadio", onDelete: "cascade" }) // onDelete opcional
  estadio!: Estadio;

  @OneToMany(() => Entrada, (entrada) => entrada.evento)
  entradas = new Collection<Entrada>(this);

  @OneToMany(() => PrecioEventoSector, (precio) => precio.evento)
  precios = new Collection<PrecioEventoSector>(this);

  constructor(data: Partial<Evento> = {}) {
    Object.assign(this, data);
  }

  // Getter para descripción (requiere que las relaciones estén cargadas)
  get descripcion(): string {
    // Es más seguro verificar si están cargados o usar wrap
    const local = wrap(this.clubLocal).isInitialized()
      ? this.clubLocal.nombre
      : "[Local no cargado]";
    const visitante = wrap(this.clubVisitante).isInitialized()
      ? this.clubVisitante.nombre
      : "[Visitante no cargado]";
    return `${local} vs ${visitante}`;
  }
}
