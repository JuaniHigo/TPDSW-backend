// src/entities/Socio.entity.ts
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  PrimaryKeyType,
} from "@mikro-orm/core";
import { User } from "./User.entity";
import { Club } from "./Club.entity";
import { SocioRepository } from "../repositories/SocioRepository";

@Entity({ tableName: "socios", repository: () => SocioRepository })
export class Socio {
  @PrimaryKey({ fieldName: "fk_id_usuario" })
  fkIdUsuario!: number;

  @PrimaryKey({ fieldName: "fk_id_club" })
  fkIdClub!: number;

  @Property({ fieldName: "nro_socio", length: 20 })
  nroSocio!: string;

  @Property({ fieldName: "fecha_asociacion" })
  fechaAsociacion!: Date;

  [PrimaryKeyType]?: [number, number];

  // Relaciones
  @ManyToOne(() => User, { fieldName: "fk_id_usuario", primary: true })
  usuario!: User;

  @ManyToOne(() => Club, { fieldName: "fk_id_club", primary: true })
  club!: Club;

  constructor(data: Partial<Socio> = {}) {
    Object.assign(this, data);
  }
}
