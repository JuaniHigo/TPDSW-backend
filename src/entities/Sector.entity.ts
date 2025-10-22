// src/entities/Sector.entity.ts
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  PrimaryKeyProp,
} from "@mikro-orm/core";
import { Estadio } from "./Estadio.entity.js";
import { Entrada } from "./Entrada.entity.js";
import { PrecioEventoSector } from "./PrecioEventoSector.entity.js";

@Entity({ tableName: "sectores" })
export class Sector {
  @PrimaryKey({ fieldName: "id_sector" })
  idSector!: number;

  @Property({ fieldName: "nombre_sector", length: 50 })
  nombreSector!: string;

  @Property()
  capacidad!: number;

  [PrimaryKeyProp]?: [number, number];

  // Relaciones
@ManyToOne(() => Estadio, { fieldName: "fk_id_estadio", primary: true })
  estadio!: Estadio;

  @OneToMany(() => Entrada, (entrada) => entrada.sector)
  entradas = new Collection<Entrada>(this);

  @OneToMany(() => PrecioEventoSector, (precio) => precio.sector)
  precios = new Collection<PrecioEventoSector>(this);

  constructor(data: Partial<Sector> = {}) {
    Object.assign(this, data);
  }
}
