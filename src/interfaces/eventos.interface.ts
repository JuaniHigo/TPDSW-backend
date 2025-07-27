export interface Evento {
    id_evento: number;
    fk_id_club_local: number;
    fk_id_club_visitante: number;
    fk_id_estadio: number;
    fecha_hora: Date;
    torneo: string;
    estado: 'Programado' | 'En Venta' | 'Finalizado' | 'Cancelado';
    solo_publico_local: boolean;
}