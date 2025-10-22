// src/entities/Socio.entity.ts
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  PrimaryKeyProp, // <-- 1. Importa esto para la clave compuesta
} from "@mikro-orm/core";
import { User } from "./User.entity.js";
import { Club } from "./Club.entity.js";
import { SocioRepository } from "../repositories/SocioRepository.js";

@Entity({ tableName: "socios", repository: () => SocioRepository })
export class Socio {
  // --- INICIO DE CORRECCIÓN ---
  // Borramos estas líneas. Son redundantes con las relaciones @ManyToOne.
  /*
  @PrimaryKey({ fieldName: "fk_id_usuario" })
  fkIdUsuario!: number;

  @PrimaryKey({ fieldName: "fk_id_club" })
  fkIdClub!: number;
  */
  // --- FIN DE CORRECCIÓN ---

  @Property({ fieldName: "nro_socio", length: 20 })
  nroSocio!: string;

  @Property({ fieldName: "fecha_asociacion" })
  fechaAsociacion!: Date;

  // --- 2. Agrega esto para definir el tipo de la PK compuesta ---
  [PrimaryKeyProp]?: [number, number];

  // Relaciones
  // Estas SÍ son las definiciones correctas de la clave primaria
  @ManyToOne(() => User, { fieldName: "fk_id_usuario", primary: true })
  usuario!: User;

  @ManyToOne(() => Club, { fieldName: "fk_id_club", primary: true })
  club!: Club;

  constructor(data: Partial<Socio> = {}) {
    Object.assign(this, data);
  }
}