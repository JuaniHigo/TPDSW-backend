// src/entities/Compra.entity.ts
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  Enum, // No hace falta wrap aquí
} from "@mikro-orm/core";
import { User } from "./User.entity.js";
import { Entrada } from "./Entrada.entity.js";
import { CompraRepository } from "../repositories/CompraRepository.js";

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

  // --- Propiedad FK eliminada ---
  // @Property({ fieldName: "fk_id_usuario" }) // <-- Se elimina
  // fkIdUsuario!: number;

  @Property({
    fieldName: "monto_total",
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  montoTotal!: number; // Asegúrate que sea number en TypeScript

  @Enum(() => MetodoPago) // Correcto
  @Property({ fieldName: "metodo_pago" }) // Correcto
  metodoPago!: MetodoPago;

  @Enum(() => EstadoPago) // Correcto
  @Property({ fieldName: "estado_pago", default: EstadoPago.PENDIENTE }) // Correcto
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
  @ManyToOne({
    entity: () => User,
    fieldName: "fk_id_usuario",
    onDelete: "cascade",
  }) // <-- Corregido
  usuario!: User; // Debe ser tipo User

  @OneToMany(() => Entrada, (entrada) => entrada.compra)
  entradas = new Collection<Entrada>(this);

  constructor(data: Partial<Compra> = {}) {
    Object.assign(this, data);
  }
}
