import { Entity, ManyToOne, PrimaryKeyProp, Property } from '@mikro-orm/core';
import { Sector } from './Sector';
import { Evento } from './Evento';

@Entity()
export class PrecioEventoSector {

  [PrimaryKeyProp]?: ['fkIdEvento', 'fkIdSector'];

  @ManyToOne({ entity: () => Evento, updateRule: 'cascade', deleteRule: 'cascade', primary: true, index: 'fk_Precios_Eventos_idx' })
  fkIdEvento!: Evento;

  @ManyToOne({ entity: () => Sector, primary: true, index: 'fk_Precios_Sectores_idx' })
  fkIdSector!: Sector;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  precio!: string;

}

