import {
  Entity,
  ManyToOne,
  type Opt,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
} from "@mikro-orm/core";
import { Usuario } from "./Usuario"; // Asegúrate que el import sea singular

@Entity()
export class Compra {
  [PrimaryKeyProp]?: "idCompra";

  @PrimaryKey({ unsigned: false, autoincrement: true }) // Autoincrement es usualmente mejor
  idCompra!: number;

  // ✅ ARREGLADO (Error 2, 4, 6): Renombrado a 'fkUsuario' para claridad
  @ManyToOne({ entity: () => Usuario, updateRule: "cascade", index: "fk_Compras_Usuarios_idx" })
  fkUsuario!: Usuario;

  @Property({ type: "datetime", defaultRaw: `CURRENT_TIMESTAMP` })
  fechaCompra!: Date & Opt;

  @Property({ type: "decimal", precision: 10, scale: 2 })
  montoTotal!: string;

  @Property({ length: 50, nullable: true })
  metodoPago?: string;

  @Property({ type: "string", length: 50, default: "Pendiente" })
  estadoPago!: string & Opt;

  // ✅ AÑADIDO (Error 3): Propiedad que faltaba
  @Property({ length: 100, nullable: true, unique: true })
  idPreferenciaMp?: string;

  // ✅ AÑADIDO (Error 5): Propiedad que faltaba
  @Property({ length: 100, nullable: true, unique: true })
  idPagoMp?: string;
}