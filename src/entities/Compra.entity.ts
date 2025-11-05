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

export enum MetodoPago /* ... */ {}
export enum EstadoPago /* ... */ {}

@Entity({ tableName: "compras", repository: () => CompraRepository })
export class Compra {
  @PrimaryKey({ fieldName: "id_compra" })
  id!: number;

<<<<<<< Updated upstream
  @Property({ fieldName: "fk_id_usuario" })
  fkIdUsuario!: number;

=======
>>>>>>> Stashed changes
  @Property({
    fieldName: "monto_total",
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  montoTotal!: number;

<<<<<<< Updated upstream
  @Enum({ items: () => MetodoPago, fieldName: "metodo_pago" })
  metodoPago!: MetodoPago;

  @Enum({
    items: () => EstadoPago,
=======
  @Enum(() => MetodoPago)
  @Property({ fieldName: "metodo_pago" })
  metodoPago!: MetodoPago;

  @Enum(() => EstadoPago)
  @Property({
>>>>>>> Stashed changes
    fieldName: "estado_pago",
    default: EstadoPago.PENDIENTE,
  })
  estadoPago: EstadoPago = EstadoPago.PENDIENTE;

  // ... (otras propiedades: idPreferenciaMP, idPagoMP, createdAt, updatedAt)

<<<<<<< Updated upstream
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
=======
  // --- CORRECCIÓN EN LA RELACIÓN ---
  // Se especifica el fieldName (columna en la BD) y el tipo correcto (User)
  @ManyToOne({
    entity: () => User,
    fieldName: "fk_id_usuario", // Esta es la columna real en tu BD
    onDelete: "cascade", // Opcional: si se borra un User, se borran sus compras
  })
  usuario!: User; // El tipo debe ser la Entidad, no 'any'
  // --- FIN DE LA CORRECCIÓN ---
>>>>>>> Stashed changes

  @OneToMany(() => Entrada, (entrada) => entrada.compra)
  entradas = new Collection<Entrada>(this);

  constructor(data: Partial<Compra> = {}) {
    Object.assign(this, data);
  }
}
