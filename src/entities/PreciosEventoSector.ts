import { Entity, OneToOne, PrimaryKeyProp, Property } from '@mikro-orm/core';
import { Sectores } from './Sectores';

@Entity()
export class PreciosEventoSector {

  [PrimaryKeyProp]?: 'fk';

  @OneToOne({ entity: () => Sectores, updateRule: 'cascade', deleteRule: 'cascade', primary: true, index: 'fk_Precios_Sectores_idx' })
  fk!: Sectores;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  precio!: string;

}
