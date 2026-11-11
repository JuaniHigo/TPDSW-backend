import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  type Opt,
} from '@mikro-orm/core';
import { Compra } from './Compra';
@Entity()
export class Pago {
  @PrimaryKey({ length: 100 }) idPago!: string;
  @ManyToOne(() => Compra) compra!: Compra;
  @Property({ length: 30 }) estado!: string;
  @Property({ length: 30, default: 'none', index: true }) reembolso: string &
    Opt = 'none';
  @Property({ type: 'datetime', defaultRaw: 'CURRENT_TIMESTAMP' })
  createdAt!: Date & Opt;
  @Property({ type: 'datetime', nullable: true }) nextRetryAt?: Date;
  @Property({ default: 0 }) attempts: number & Opt = 0;
}
