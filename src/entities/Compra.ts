import {
  Entity,
  ManyToOne,
  type Opt,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
} from '@mikro-orm/core';
import { Usuario } from './Usuario'; // Asegúrate que el import sea singular

@Entity()
export class Compra {
  [PrimaryKeyProp]?: 'idCompra';

  @PrimaryKey({ unsigned: false, autoincrement: true }) // Autoincrement es usualmente mejor
  idCompra!: number;

  @ManyToOne({
    entity: () => Usuario,
    updateRule: 'cascade',
    index: 'fk_Compras_Usuarios_idx',
  })
  fkUsuario!: Usuario;

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  fechaCompra!: Date & Opt;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  montoTotal!: string;

  @Property({ length: 50, nullable: true })
  metodoPago?: string;

  @Property({ type: 'string', length: 50, default: 'Pendiente' })
  estadoPago!: string & Opt;

  @Property({ length: 100, nullable: true, unique: true })
  idPreferenciaMp?: string;

  @Property({ length: 100, nullable: true, unique: true })
  idPagoMp?: string;
  @Property({ nullable: true }) eventoId?: number;
  @Property({ nullable: true }) sectorId?: number;
  @Property({ nullable: true }) quantity?: number;
  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioUnitario?: string;
  @Property({ length: 3, default: 'ARS' }) moneda: string & Opt = 'ARS';
  @Property({ type: 'datetime', nullable: true, index: true }) expiresAt?: Date;
  @Property({ length: 100, nullable: true, unique: true })
  idempotencyKey?: string;
  @Property({ type: 'text', nullable: true }) checkoutUrl?: string;
  @Property({ type: 'json', nullable: true }) snapshot?: PurchaseSnapshot;
  @Property({ length: 30, default: 'none' }) preferenceStatus: string & Opt =
    'none';
}
export interface PurchaseSnapshot {
  nombreLocal: string;
  nombreVisitante: string;
  logoLocal?: string;
  logoVisitante?: string;
  nombreEstadio: string;
  nombreSector: string;
  fechaHora: string;
  torneo?: string;
}
