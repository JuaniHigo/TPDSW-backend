// src/entities/Sector.entity.ts
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  PrimaryKeyProp, // <-- Importa PrimaryKeyProp
} from "@mikro-orm/core";
import { Estadio } from "./Estadio.entity.js";
import { Entrada } from "./Entrada.entity.js";
import { PrecioEventoSector } from "./PrecioEventoSector.entity.js";

@Entity({ tableName: "sectores" })
export class Sector {
  @PrimaryKey({ fieldName: "id_sector" }) // Parte 1 de la PK
  idSector!: number;

  // --- Propiedad FK eliminada ---

  @Property({ fieldName: "nombre_sector", length: 50 })
  nombreSector!: string;

  @Property()
  capacidad!: number;

  // --- Definición de la Clave Compuesta ---
  [PrimaryKeyProp]?: ["idSector", "estadio"]; // Usa los nombres de las PROPIEDADES

  // Relaciones
  @ManyToOne(() => Estadio, {
    fieldName: "fk_id_estadio",
    primary: true,
    onDelete: "cascade",
  }) // Parte 2 de la PK
  estadio!: Estadio;
  // --- Fin Definición Clave Compuesta ---

  @OneToMany(() => Entrada, (entrada) => entrada.sector)
  entradas = new Collection<Entrada>(this);

  @OneToMany(() => PrecioEventoSector, (precio) => precio.sector)
  precios = new Collection<PrecioEventoSector>(this);

  constructor(data: Partial<Sector> = {}) {
    Object.assign(this, data);
  }
}
