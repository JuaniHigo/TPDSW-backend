// src/entities/Sector.entity.ts
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  PrimaryKeyType,
} from "@mikro-orm/core";
import { Estadio } from "./Estadio.entity";
import { Entrada } from "./Entrada.entity";
import { PrecioEventoSector } from "./PrecioEventoSector.entity";

@Entity({ tableName: "sectores" })
export class Sector {
  @PrimaryKey({ fieldName: "id_sector" })
  idSector!: number;

  @PrimaryKey({ fieldName: "fk_id_estadio" })
  fkIdEstadio!: number;

  @Property({ fieldName: "nombre_sector", length: 50 })
  nombreSector!: string;

  @Property()
  capacidad!: number;

  // Para que MikroORM entienda la clave primaria compuesta
  [PrimaryKeyType]?: [number, number];

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
