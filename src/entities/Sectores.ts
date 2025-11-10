import { Entity, ManyToOne, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core';
import { Estadios } from './Estadios';

@Entity()
export class Sectores {

  [PrimaryKeyProp]?: ['idSector', 'fk'];

  @PrimaryKey({ unsigned: false, autoincrement: true })
  idSector!: number;

  @ManyToOne({ entity: () => Estadios, updateRule: 'cascade', primary: true, index: 'fk_Sectores_Estadios_idx' })
  fkIdEstadio!: Estadios;

  @Property({ length: 100 })
  nombreSector!: string;

  @Property({ unsigned: true, nullable: true })
  capacidad?: number;

}
