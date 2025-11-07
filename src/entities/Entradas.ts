import { Entity, ManyToOne, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core';
import { Sectores } from './Sectores';

@Entity()
export class Entradas {

  [PrimaryKeyProp]?: 'idEntrada';

  @PrimaryKey({ unsigned: false })
  idEntrada!: number;

  @ManyToOne({ entity: () => Sectores, updateRule: 'cascade', index: 'fk_Entradas_Sectores_idx' })
  fk!: Sectores;

  @Property({ length: 10, nullable: true })
  fila?: string;

  @Property({ length: 10, nullable: true })
  asiento?: string;

  @Property({ unique: 'codigo_qr_UNIQUE' })
  codigoQr!: string;

}
