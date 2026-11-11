import { z } from 'zod';
import { LockMode } from '@mikro-orm/core';
import { PrecioEventoSector } from '../entities/PrecioEventoSector';
import { Evento } from '../entities/Evento';
import { Sector } from '../entities/Sector';
import { Compra } from '../entities/Compra';
import { Entrada } from '../entities/Entrada';
import { em, handler, id, list, pagination, HttpError } from '../lib/http';
import { cents, decimal } from '../lib/money';
const dto = (p: PrecioEventoSector) => ({
  fkIdEvento: p.fkIdEvento.idEvento,
  fkIdSector: p.fkIdSector.idSector,
  precio: p.precio,
});
export const getPreciosPorEvento = handler(async (req, res) => {
  const p = pagination(req),
    [rows, total] = await em().findAndCount(
      PrecioEventoSector,
      { fkIdEvento: id(req.params.idEvento) },
      { limit: p.limit, offset: p.offset, orderBy: { fkIdSector: 'asc' } },
    );
  return res.json(list(rows.map(dto), total, p));
});
export const setPrecio = handler(async (req, res) => {
  const input = z
    .object({
      fkIdEvento: z.number().int().positive(),
      fkIdSector: z.number().int().positive(),
      precio: z.string().regex(/^\d+(\.\d{1,2})?$/),
    })
    .parse(req.body);
  const amount = cents(input.precio);
  if (!amount || amount > 9999999999)
    throw new HttpError(400, 'INVALID_AMOUNT', 'Precio inválido');
  const data = await em().transactional(async (tx) => {
    const e = await tx.findOne(
      Evento,
      { idEvento: input.fkIdEvento },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    const s = await tx.findOne(
      Sector,
      { idSector: input.fkIdSector },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    if (!e || !s || s.fkIdEstadio.idEstadio !== e.fkIdEstadio.idEstadio)
      throw new HttpError(
        400,
        'INVALID_SECTOR',
        'El sector no pertenece al estadio del evento',
      );
    let p = await tx.findOne(
      PrecioEventoSector,
      { fkIdEvento: e.idEvento, fkIdSector: s.idSector },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    if (!p) {
      p = tx.create(PrecioEventoSector, {
        fkIdEvento: e,
        fkIdSector: s,
        precio: decimal(amount),
      });
      tx.persist(p);
    } else p.precio = decimal(amount);
    await tx.flush();
    return dto(p);
  });
  return res.status(201).json(data);
});
export const deletePrecio = handler(async (req, res) => {
  await em().transactional(async (tx) => {
    const eid = id(req.params.idEvento),
      sid = id(req.params.idSector);
    await tx.findOne(
      Evento,
      { idEvento: eid },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    await tx.findOne(
      Sector,
      { idSector: sid },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    const p = await tx.findOne(
      PrecioEventoSector,
      { fkIdEvento: eid, fkIdSector: sid },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    if (!p) throw new HttpError(404, 'NOT_FOUND', 'Precio no encontrado');
    if (
      (await tx.count(Compra, { eventoId: eid, sectorId: sid })) ||
      (await tx.count(Entrada, { fkIdEvento: eid, fkIdSector: sid }))
    )
      throw new HttpError(
        409,
        'IN_USE',
        'El precio está asociado a compras o entradas',
      );
    await tx.removeAndFlush(p);
  });
  return res.sendStatus(204);
});
