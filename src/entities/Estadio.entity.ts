// src/entities/Estadio.entity.ts
import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
  Collection,
} from "@mikro-orm/core";
import { Evento } from "./Evento.entity";
import { Sector } from "./Sector.entity";

@Entity({ tableName: "estadios" })
export class Estadio {
  @PrimaryKey({ fieldName: "id_estadio" })
  id!: number;

  @Property({ length: 100 })
  nombre!: string;

  @Property({ length: 100 })
  calle!: string;

  @Property({ length: 10 })
  numero!: string;

  @Property({ length: 50 })
  ciudad!: string;

  // Relaciones
  @OneToMany(() => Evento, (evento) => evento.estadio)
  eventos = new Collection<Evento>(this);

  @OneToMany(() => Sector, (sector) => sector.estadio)
  sectores = new Collection<Sector>(this);

  constructor(data: Partial<Estadio> = {}) {
    Object.assign(this, data);
  }

  get direccionCompleta(): string {
    return `${this.calle} ${this.numero}, ${this.ciudad}`;
  }
}
