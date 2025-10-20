// src/entities/Compra.entity.ts
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  Enum,
} from "@mikro-orm/core";
import { User } from "./User.entity";
import { Entrada } from "./Entrada.entity";
import { CompraRepository } from "../repositories/CompraRepository";

export enum MetodoPago {
  MERCADOPAGO = "mercadopago",
  TARJETA = "tarjeta",
  EFECTIVO = "efectivo",
}

export enum EstadoPago {
  PENDIENTE = "pendiente",
  COMPLETADA = "completada",
  FALLIDA = "fallida",
  CANCELADA = "cancelada",
}

@Entity({ tableName: "compras", repository: () => CompraRepository })
export class Compra {
  @PrimaryKey({ fieldName: "id_compra" })
  id!: number;

  @Property({ fieldName: "fk_id_usuario" })
  fkIdUsuario!: number;

  @Property({
    fieldName: "monto_total",
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  montoTotal!: number;

  @Enum({ items: () => MetodoPago, fieldName: "metodo_pago" })
  metodoPago!: MetodoPago;

  @Enum({
    items: () => EstadoPago,
    fieldName: "estado_pago",
    default: EstadoPago.PENDIENTE,
  })
  estadoPago: EstadoPago = EstadoPago.PENDIENTE;

  @Property({ fieldName: "id_preferencia_mp", nullable: true })
  idPreferenciaMP?: string;

  @Property({ fieldName: "id_pago_mp", nullable: true })
  idPagoMP?: string;

  @Property({ fieldName: "created_at", defaultRaw: "CURRENT_TIMESTAMP" })
  createdAt: Date = new Date();

  @Property({
    fieldName: "updated_at",
    defaultRaw: "CURRENT_TIMESTAMP",
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();

  // Relaciones
  @ManyToOne(() => User, { fieldName: "fk_id_usuario" })
  usuario!: User;

  @OneToMany(() => Entrada, (entrada) => entrada.compra)
  entradas = new Collection<Entrada>(this);

  constructor(data: Partial<Compra> = {}) {
    Object.assign(this, data);
  }
}
