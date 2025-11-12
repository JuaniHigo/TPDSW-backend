import { Entity, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core';

@Entity()
export class Estadio {

  [PrimaryKeyProp]?: 'idEstadio';

  @PrimaryKey({ unsigned: false })
  idEstadio!: number;

  @Property({ length: 100 })
  nombre!: string;

  @Property({ length: 150, nullable: true })
  calle?: string;

  @Property({ length: 10, nullable: true })
  numero?: string;

  @Property({ length: 100, nullable: true })
  ciudad?: string;

}
