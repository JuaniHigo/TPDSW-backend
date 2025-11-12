import { Entity, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core';

@Entity()
export class Club {

  [PrimaryKeyProp]?: 'idClub';

  @PrimaryKey({ unsigned: false })
  idClub!: number;

  @Property({ length: 100, unique: 'nombre_UNIQUE' })
  nombre!: string;

  @Property({ nullable: true })
  logoUrl?: string;

}
