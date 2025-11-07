import { Entity, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core';

@Entity()
export class Usuarios {

  [PrimaryKeyProp]?: 'idUsuario';

  @PrimaryKey({ unsigned: false })
  idUsuario!: number;

  @Property({ length: 20, unique: 'dni_UNIQUE' })
  dni!: string;

  @Property({ length: 100 })
  nombre!: string;

  @Property({ length: 100 })
  apellido!: string;

  @Property({ unique: 'email_UNIQUE' })
  email!: string;

  @Property()
  password!: string;

  @Property({ type: 'date', nullable: true })
  fechaNacimiento?: string;

}
