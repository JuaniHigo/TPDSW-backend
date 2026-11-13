import { LockMode } from '@mikro-orm/core';
import { Evento, EventosEstado } from '../entities/Evento';
import { Club } from '../entities/Club';
import { Estadio } from '../entities/Estadio';
import { PrecioEventoSector } from '../entities/PrecioEventoSector';
import { Compra } from '../entities/Compra';
import { Entrada } from '../entities/Entrada';
import { em, handler, id, pagination, list, HttpError } from '../lib/http';
import { eventDto } from '../lib/dto';
import { reservingStates } from '../services/checkout';
const populate = ['fkIdClubLocal', 'fkIdClubVisitante', 'fkIdEstadio'] as const;
export const getAllEventos = handler(async (req, res) => {
  const p = pagination(req),
    [rows, total] = await em().findAndCount(
      Evento,
      {},
      {
        populate: [...populate],
        limit: p.limit,
        offset: p.offset,
        orderBy: { fechaHora: 'desc' },
      },
    );
  return res.json(list(rows.map(eventDto), total, p));
});
export const getEventoById = handler(async (req, res) => {
  const e = await em().findOne(
    Evento,
    { idEvento: id(req.params.id) },
    { populate: [...populate] },
  );
  if (!e) throw new HttpError(404, 'NOT_FOUND', 'Evento no encontrado');
  return res.json(eventDto(e));
});
export const getSectoresEvento = handler(async (req, res) => {
  const eid = id(req.params.id),
    e = await em().findOne(Evento, { idEvento: eid });
  if (!e) throw new HttpError(404, 'NOT_FOUND', 'Evento no encontrado');
  const p = pagination(req);
  const [prices, total] = await em().findAndCount(
    PrecioEventoSector,
    { fkIdEvento: eid },
    {
      populate: ['fkIdSector'],
      limit: p.limit,
      offset: p.offset,
      orderBy: { fkIdSector: 'asc' },
    },
  );
  const now = new Date();
  const onSale = e.estado === EventosEstado['EN VENTA'] && e.fechaHora > now;
  const occupiedBySector = new Map<number, number>();
  if (onSale) {
    const connection = em().getConnection();
    const sold: { sectorId: number; quantity: number }[] =
      await connection.execute(
        'select fk_id_sector_id_sector as sectorId, count(*) as quantity from entrada where fk_id_evento_id_evento = ? group by fk_id_sector_id_sector',
        [eid],
      );
    const reservations: { sectorId: number; quantity: number }[] =
      await connection.execute(
        'select sector_id as sectorId, sum(quantity) as quantity from compra where evento_id = ? and estado_pago in (?, ?) and expires_at > ? group by sector_id',
        [eid, ...reservingStates, now],
      );
    for (const row of [...sold, ...reservations])
      occupiedBySector.set(
        row.sectorId,
        (occupiedBySector.get(row.sectorId) ?? 0) + Number(row.quantity),
      );
  }
  const data = prices.map((p) => ({
    idSector: p.fkIdSector.idSector,
    nombreSector: p.fkIdSector.nombreSector,
    capacidad: p.fkIdSector.capacidad ?? null,
    precio: p.precio,
    disponibles: onSale
      ? Math.max(
          0,
          (p.fkIdSector.capacidad ?? 0) -
            (occupiedBySector.get(p.fkIdSector.idSector) ?? 0),
        )
      : 0,
  }));
  return res.json(list(data, total, p));
});
async function validateRelations(
  tx: ReturnType<typeof em>,
  data: Record<string, unknown>,
  existing?: Evento,
) {
  const local = Number(data.fkIdClubLocal ?? existing?.fkIdClubLocal.idClub),
    away = Number(data.fkIdClubVisitante ?? existing?.fkIdClubVisitante.idClub),
    stadium = Number(data.fkIdEstadio ?? existing?.fkIdEstadio.idEstadio);
  if (local === away)
    throw new HttpError(400, 'INVALID_CLUBS', 'Los clubes deben ser distintos');
  if (
    !(await tx.findOne(Club, { idClub: local })) ||
    !(await tx.findOne(Club, { idClub: away })) ||
    !(await tx.findOne(Estadio, { idEstadio: stadium }))
  )
    throw new HttpError(400, 'INVALID_RELATION', 'Club o estadio inexistente');
  if ((data.estado ?? existing?.estado) === EventosEstado['EN VENTA']) {
    const date = data.fechaHora
      ? new Date(String(data.fechaHora))
      : existing?.fechaHora;
    if (!date || date.getTime() <= Date.now())
      throw new HttpError(400, 'INVALID_DATE', 'El evento debe ser futuro');
    if (existing) {
      const prices = await tx.find(
        PrecioEventoSector,
        { fkIdEvento: existing.idEvento },
        { populate: ['fkIdSector'] },
      );
      if (
        !prices.length ||
        prices.some(
          (p) =>
            !p.fkIdSector.capacidad ||
            p.fkIdSector.fkIdEstadio.idEstadio !== stadium,
        )
      )
        throw new HttpError(
          409,
          'INVALID_OFFER',
          'Configurá precios y capacidad antes de habilitar la venta',
        );
    } else
      throw new HttpError(
        409,
        'INVALID_OFFER',
        'Creá el evento programado y configurá sus precios antes de vender',
      );
  }
  return { local, away, stadium };
}
export const createEvento = handler(async (req, res) => {
  const { local, away, stadium } = await validateRelations(em(), req.body);
  const e = em().create(Evento, {
    ...req.body,
    fkIdClubLocal: local,
    fkIdClubVisitante: away,
    fkIdEstadio: stadium,
    fechaHora: new Date(req.body.fechaHora),
  });
  await em().persistAndFlush(e);
  await em().populate(e, [...populate]);
  return res.status(201).json(eventDto(e));
});
export const updateEvento = handler(async (req, res) => {
  const result = await em().transactional(async (tx) => {
    const eid = id(req.params.id),
      e = await tx.findOne(
        Evento,
        { idEvento: eid },
        { lockMode: LockMode.PESSIMISTIC_WRITE, populate: [...populate] },
      );
    if (!e) throw new HttpError(404, 'NOT_FOUND', 'Evento no encontrado');
    const prices = await tx.find(
      PrecioEventoSector,
      { fkIdEvento: eid },
      { lockMode: LockMode.PESSIMISTIC_WRITE, orderBy: { fkIdSector: 'asc' } },
    );
    const related =
      (await tx.count(Compra, { eventoId: eid })) ||
      (await tx.count(Entrada, { fkIdEvento: eid }));
    if (
      related &&
      ['fkIdClubLocal', 'fkIdClubVisitante', 'fkIdEstadio'].some(
        (k) =>
          req.body[k] !== undefined &&
          req.body[k] !==
            (
              {
                fkIdClubLocal: e.fkIdClubLocal.idClub,
                fkIdClubVisitante: e.fkIdClubVisitante.idClub,
                fkIdEstadio: e.fkIdEstadio.idEstadio,
              } as Record<string, number>
            )[k],
      )
    )
      throw new HttpError(409, 'IN_USE', 'El evento tiene compras o entradas');
    if (
      !related &&
      req.body.fkIdEstadio &&
      req.body.fkIdEstadio !== e.fkIdEstadio.idEstadio &&
      prices.length
    )
      throw new HttpError(
        409,
        'HAS_PRICES',
        'Eliminá los precios antes de cambiar de estadio',
      );
    await validateRelations(tx, req.body, e);
    tx.assign(e, {
      ...req.body,
      ...(req.body.fechaHora
        ? { fechaHora: new Date(req.body.fechaHora) }
        : {}),
    });
    if (req.body.estado === EventosEstado.CANCELADO)
      await tx.nativeUpdate(
        Compra,
        { eventoId: eid, estadoPago: { $in: reservingStates } },
        { estadoPago: 'cancelada' },
      );
    await tx.flush();
    await tx.populate(e, [...populate]);
    return eventDto(e);
  });
  return res.json(result);
});
export const deleteEvento = handler(async (req, res) => {
  await em().transactional(async (tx) => {
    const eid = id(req.params.id),
      e = await tx.findOne(
        Evento,
        { idEvento: eid },
        { lockMode: LockMode.PESSIMISTIC_WRITE },
      );
    if (!e) throw new HttpError(404, 'NOT_FOUND', 'Evento no encontrado');
    if (
      (await tx.count(Compra, { eventoId: eid })) ||
      (await tx.count(Entrada, { fkIdEvento: eid }))
    )
      throw new HttpError(409, 'IN_USE', 'El evento tiene compras o entradas');
    await tx.nativeDelete(Evento, { idEvento: eid });
  });
  return res.sendStatus(204);
});
