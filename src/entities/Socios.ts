import { Entity, OneToOne, PrimaryKeyProp, Property } from '@mikro-orm/core';
import { Clubes } from './Clubes';

@Entity()
export class Socios {

  [PrimaryKeyProp]?: 'fk';

  @OneToOne({ entity: () => Clubes, updateRule: 'cascade', deleteRule: 'cascade', primary: true, index: 'fk_Socios_Clubes_idx' })
  fk!: Clubes;

  @Property({ length: 50 })
  nroSocio!: string;

  @Property({ type: 'date', nullable: true })
  fechaAsociacion?: string;

}
