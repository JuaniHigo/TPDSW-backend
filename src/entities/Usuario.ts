import {
  Entity,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  Opt,
} from "@mikro-orm/core";

@Entity()
export class Usuario {
  [PrimaryKeyProp]?: "idUsuario";

  @PrimaryKey({ unsigned: false })
  idUsuario!: number;

  @Property({ length: 20, unique: "dni_UNIQUE" })
  dni!: string;

  @Property({ length: 100 })
  nombre!: string;

  @Property({ length: 100 })
  apellido!: string;

  @Property({ unique: "email_UNIQUE" })
  email!: string;

  @Property()
  password!: string;

  @Property({ type: "date", nullable: true })
  fechaNacimiento?: string;

  @Property({ length: 50, default: "user" })
  rol!: string & Opt;
}
