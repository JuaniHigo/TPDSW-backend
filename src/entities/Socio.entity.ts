// src/entities/Socio.entity.ts
import {
  Entity,
  Property,
  ManyToOne,
  PrimaryKeyProp, // <-- Importa PrimaryKeyProp
} from "@mikro-orm/core";
import { User } from "./User.entity.js";
import { Club } from "./Club.entity.js";
import { SocioRepository } from "../repositories/SocioRepository.js";

@Entity({ tableName: "socios", repository: () => SocioRepository })
export class Socio {
  // --- Propiedades FK eliminadas ---

  @Property({ fieldName: "nro_socio", length: 20 })
  nroSocio!: string;

  @Property({ fieldName: "fecha_asociacion", type: "date" }) // type: 'date'
  fechaAsociacion!: Date;

  // --- Definición de la Clave Compuesta ---
  [PrimaryKeyProp]?: ["usuario", "club"]; // Usa los nombres de las PROPIEDADES de relación

  // Relaciones (Estas son las Primary Keys)
  @ManyToOne(() => User, {
    fieldName: "fk_id_usuario",
    primary: true,
    onDelete: "cascade",
  })
  usuario!: User;

  @ManyToOne(() => Club, {
    fieldName: "fk_id_club",
    primary: true,
    onDelete: "cascade",
  })
  club!: Club;
  // --- Fin Definición Clave Compuesta ---

  constructor(data: Partial<Socio> = {}) {
    Object.assign(this, data);
  }
}
