import { Club } from '../entities/Club';
import { Estadio } from '../entities/Estadio';
import { Sector } from '../entities/Sector';
import { Evento } from '../entities/Evento';
import { Usuario } from '../entities/Usuario';
import { Entrada } from '../entities/Entrada';
import { Compra } from '../entities/Compra';
export const userDto = (u: Usuario) => ({
  idUsuario: u.idUsuario,
  dni: u.dni,
  nombre: u.nombre,
  apellido: u.apellido,
  email: u.email,
  fechaNacimiento: u.fechaNacimiento ?? null,
  rol: u.rol,
});
export const clubDto = (c: Club) => ({
  idClub: c.idClub,
  nombre: c.nombre,
  logoUrl: c.logoUrl ?? null,
});
export const stadiumDto = (s: Estadio) => ({
  idEstadio: s.idEstadio,
  nombre: s.nombre,
  calle: s.calle ?? null,
  numero: s.numero ?? null,
  ciudad: s.ciudad ?? null,
});
export const sectorDto = (s: Sector) => ({
  idSector: s.idSector,
  fkIdEstadio: s.fkIdEstadio.idEstadio,
  nombreSector: s.nombreSector,
  capacidad: s.capacidad ?? null,
});
export const eventDto = (e: Evento) => ({
  idEvento: e.idEvento,
  fkIdClubLocal: e.fkIdClubLocal.idClub,
  fkIdClubVisitante: e.fkIdClubVisitante.idClub,
  fkIdEstadio: e.fkIdEstadio.idEstadio,
  fechaHora: e.fechaHora.toISOString(),
  torneo: e.torneo ?? null,
  estado: e.estado,
  soloPublicoLocal: e.soloPublicoLocal,
  nombreLocal: e.fkIdClubLocal.nombre,
  nombreVisitante: e.fkIdClubVisitante.nombre,
  logoLocal: e.fkIdClubLocal.logoUrl ?? null,
  logoVisitante: e.fkIdClubVisitante.logoUrl ?? null,
  nombreEstadio: e.fkIdEstadio.nombre,
});
export function ticketDto(e: Entrada) {
  const s = e.snapshot ?? e.fkIdCompra?.snapshot;
  return {
    esDemo: e.fkIdCompra?.metodoPago === 'demo',
    idEntrada: e.idEntrada,
    codigoQr: e.codigoQr,
    fechaCompra: e.fkIdCompra?.fechaCompra.toISOString(),
    idEvento: e.fkIdEvento.idEvento,
    fechaHora: s?.fechaHora ?? e.fkIdEvento.fechaHora.toISOString(),
    torneo: s ? s.torneo : e.fkIdEvento.torneo,
    nombreLocal: s?.nombreLocal ?? e.fkIdEvento.fkIdClubLocal.nombre,
    nombreVisitante:
      s?.nombreVisitante ?? e.fkIdEvento.fkIdClubVisitante.nombre,
    logoLocal: s ? s.logoLocal : e.fkIdEvento.fkIdClubLocal.logoUrl,
    logoVisitante: s ? s.logoVisitante : e.fkIdEvento.fkIdClubVisitante.logoUrl,
    nombreSector: s?.nombreSector ?? e.fkIdSector.nombreSector,
  };
}
export const purchaseDto = (c: Compra) => ({
  provider:
    c.metodoPago === 'demo' || c.metodoPago === 'mercadopago'
      ? c.metodoPago
      : null,
  idCompra: c.idCompra,
  estado: c.estadoPago,
  montoTotal: c.montoTotal,
  moneda: c.moneda,
  expiresAt: c.expiresAt?.toISOString(),
  quantity: c.quantity,
  snapshot: c.snapshot,
});
