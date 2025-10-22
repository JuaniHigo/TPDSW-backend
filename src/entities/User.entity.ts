import {
  Entity,
  PrimaryKey,
  Property,
  Unique,
  OneToMany,
  Collection,
  Enum,
} from "@mikro-orm/core";
import { Socio } from "./Socio.entity.js";
import { Compra } from "./Compra.entity.js";
import { UserRepository } from "../repositories/UserRepository.js";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

@Entity({ tableName: "usuarios", repository: () => UserRepository })
export class User {
  @PrimaryKey({ fieldName: "id_usuario" })
  id!: number;

  @Property({ length: 8 })
  @Unique()
  dni!: string;

  @Property({ length: 100 })
  nombre!: string;

  @Property({ length: 100 })
  apellidos!: string;

  @Property({ length: 150 })
  @Unique()
  email!: string;

  @Property({ length: 255, hidden: true })
  password!: string;

  @Property({ fieldName: "fecha_nacimiento", nullable: true })
  fechaNacimiento?: Date;

  @Enum(() => UserRole)
  role: UserRole = UserRole.USER;

  @Property({ fieldName: "fecha_creacion", defaultRaw: "CURRENT_TIMESTAMP" })
  fechaCreacion: Date = new Date();

  @Property({
    fieldName: "fecha_actualizacion",
    defaultRaw: "CURRENT_TIMESTAMP",
    onUpdate: () => new Date(),
  })
  fechaActualizacion: Date = new Date();

  // Relaciones
  @OneToMany(() => Socio, (socio) => socio.usuario)
  socios = new Collection<Socio>(this);

  @OneToMany(() => Compra, (compra) => compra.usuario)
  compras = new Collection<Compra>(this);

  constructor(data: Partial<User> = {}) {
    Object.assign(this, data);
  }

  get nombreCompleto(): string {
    return `${this.nombre} ${this.apellidos}`;
  }
}
