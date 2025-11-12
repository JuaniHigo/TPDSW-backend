import { Entity, ManyToOne, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core';
import { Sector } from './Sector';
import { Evento } from './Evento'; 
import { Compra } from './Compra';

@Entity()
export class Entrada {

  [PrimaryKeyProp]?: 'idEntrada';

  @PrimaryKey({ unsigned: false })
  idEntrada!: number;

  @ManyToOne({ entity: () => Sector, updateRule: 'cascade', index: 'fk_Entradas_Sectores_idx' })
  fkIdSector!: Sector;

  @ManyToOne({ entity: () => Evento, updateRule: 'cascade', index: 'fk_Entradas_Eventos_idx' })
  fkIdEvento!: Evento; // <-- RELACIÓN NUEVA Y CRÍTICA

  @ManyToOne({ entity: () => Compra, updateRule: 'cascade', index: 'fk_Entradas_Compras_idx', nullable: true })
  fkIdCompra?: Compra; // <-- RELACIÓN NUEVA Y CRÍTICA (nullable: true para que pueda existir sin estar comprada)

  @Property({ length: 10, nullable: true })
  fila?: string;

  @Property({ length: 10, nullable: true })
  asiento?: string;

  @Property({ unique: 'codigo_qr_UNIQUE' })
  codigoQr!: string;

}
