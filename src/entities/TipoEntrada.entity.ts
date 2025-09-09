// src/entities/TipoEntrada.entity.ts
import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ tableName: "tipo_entradas" })
export class TipoEntrada {
  @PrimaryKey()
  id!: number;

  @Property({ length: 50 })
  nombre!: string;

  @Property({ type: "decimal", precision: 10, scale: 2 })
  precio!: number;

  constructor(data: Partial<TipoEntrada> = {}) {
    Object.assign(this, data);
  }
}
