import { Entity, ManyToMany, ManyToOne, OneToOne, PrimaryKeyProp, Property } from '@mikro-orm/core';
import { Sector } from './Sector';
import { Evento } from './Evento';

@Entity()
export class PrecioEventoSector {

  [PrimaryKeyProp]?: ['fkIdEvento', 'fkIdSector'];

  @ManyToOne({ entity: () => Sector, updateRule: 'cascade', deleteRule: 'cascade', primary: true, index: 'fk_Precios_Sectores_idx' })
  fkIdEvento!: Evento;

  @ManyToOne({ entity: () => Sector, primary: true }) // <-- PK y FK
  fkIdSector!: Sector;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  precio!: string;

}
