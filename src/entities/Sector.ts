import { Entity, ManyToOne, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core';
import { Estadio } from './Estadio';

@Entity()
export class Sector {

  [PrimaryKeyProp]?: 'idSector';

  @PrimaryKey({ unsigned: false, autoincrement: true })
  idSector!: number;

  @ManyToOne({ entity: () => Estadio, updateRule: 'cascade',  index: 'fk_Sectores_Estadios_idx' })
  fkIdEstadio!: Estadio;

  @Property({ length: 100 })
  nombreSector!: string;

  @Property({ unsigned: true, nullable: true })
  capacidad?: number;

}
