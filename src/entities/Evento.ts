import { Entity, Enum, ManyToOne, type Opt, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/core';
import { Club } from './Club';
import { Estadio } from './Estadio';

@Entity()
export class Evento {

  [PrimaryKeyProp]?: 'idEvento';

  @PrimaryKey({ unsigned: false })
  idEvento!: number;

  @ManyToOne({ entity: () => Club, fieldName: 'fk_id_club_local', updateRule: 'cascade', index: 'fk_Eventos_ClubLocal_idx' })
  fkIdClubLocal!: Club;

  @ManyToOne({ entity: () => Club, fieldName: 'fk_id_club_visitante', updateRule: 'cascade', index: 'fk_Eventos_ClubVisitante_idx' })
  fkIdClubVisitante!: Club;

  @ManyToOne({ entity: () => Estadio, updateRule: 'cascade', index: 'fk_Eventos_Estadios_idx' })
  fkIdEstadio!: Estadio;

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
