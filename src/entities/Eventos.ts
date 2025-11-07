import { Entity, Enum, ManyToOne, type Opt, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core';
import { Clubes } from './Clubes';
import { Estadios } from './Estadios';

@Entity()
export class Eventos {

  [PrimaryKeyProp]?: 'idEvento';

  @PrimaryKey({ unsigned: false })
  idEvento!: number;

  @ManyToOne({ entity: () => Clubes, fieldName: 'fk_id_club_local', updateRule: 'cascade', index: 'fk_Eventos_ClubLocal_idx' })
  fkIdClubLocal!: Clubes;

  @ManyToOne({ entity: () => Clubes, fieldName: 'fk_id_club_visitante', updateRule: 'cascade', index: 'fk_Eventos_ClubVisitante_idx' })
  fkIdClubVisitante!: Clubes;

  @ManyToOne({ entity: () => Estadios, updateRule: 'cascade', index: 'fk_Eventos_Estadios_idx' })
  fk!: Estadios;

  @Property()
  fechaHora!: Date;

  @Property({ length: 100, nullable: true })
  torneo?: string;

  @Enum({ items: () => EventosEstado })
  estado: EventosEstado & Opt = EventosEstado.PROGRAMADO;

  @Property({ type: 'boolean' })
  soloPublicoLocal: boolean & Opt = false;

}

export enum EventosEstado {
  PROGRAMADO = 'Programado',
  'EN VENTA' = 'En Venta',
  FINALIZADO = 'Finalizado',
  CANCELADO = 'Cancelado',
}
