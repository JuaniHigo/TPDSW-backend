import { Entity, ManyToOne, type Opt, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core';
import { Usuarios } from './Usuarios';

@Entity()
export class Compras {

  [PrimaryKeyProp]?: 'idCompra';

  @PrimaryKey({ unsigned: false })
  idCompra!: number;

  @ManyToOne({ entity: () => Usuarios, updateRule: 'cascade', index: 'fk_Compras_Usuarios_idx' })
  fk!: Usuarios;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  fechaCompra!: Date & Opt;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  montoTotal!: string;

  @Property({ length: 50, nullable: true })
  metodoPago?: string;

  @Property({ type: 'string', length: 50 })
  estadoPago: string & Opt = 'Pendiente';

}
