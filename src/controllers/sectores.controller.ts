import { LockMode } from '@mikro-orm/core';
import { Sector } from '../entities/Sector';
import { Estadio } from '../entities/Estadio';
import { Evento } from '../entities/Evento';
import { PrecioEventoSector } from '../entities/PrecioEventoSector';
import { Compra } from '../entities/Compra';
import { Entrada } from '../entities/Entrada';
import { em, handler, id, pagination, list, HttpError } from '../lib/http';
import { sectorDto } from '../lib/dto';
import { occupied } from '../services/checkout';
export const getAllSectores = handler(async (req, res) => {
  const p = pagination(req),
    filter = req.query.fkIdEstadio
      ? { fkIdEstadio: id(req.query.fkIdEstadio) }
      : {};
  const [rows, total] = await em().findAndCount(Sector, filter, {
    limit: p.limit,
    offset: p.offset,
    orderBy: { nombreSector: 'asc' },
  });
  return res.json(list(rows.map(sectorDto), total, p));
});
export const getSectorById = handler(async (req, res) => {
  const s = await em().findOne(Sector, { idSector: id(req.params.id) });
  if (!s) throw new HttpError(404, 'NOT_FOUND', 'Sector no encontrado');
  return res.json(sectorDto(s));
});
export const createSector = handler(async (req, res) => {
  const { fkIdEstadio, nombreSector, capacidad } = req.body;
  const stadium = await em().findOne(Estadio, { idEstadio: fkIdEstadio });
  if (!stadium)
    throw new HttpError(400, 'INVALID_STADIUM', 'Estadio inexistente');
  const s = em().create(Sector, {
    fkIdEstadio: stadium,
    nombreSector,
    capacidad,
  });
  await em().persistAndFlush(s);
  return res.status(201).json(sectorDto(s));
});
export const updateSector = handler(async (req, res) => {
  const sid = id(req.params.id);
  const dto = await em().transactional(async (tx) => {
    const s = await tx.findOne(
      Sector,
      { idSector: sid },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    if (!s) throw new HttpError(404, 'NOT_FOUND', 'Sector no encontrado');
    await tx.find(
      PrecioEventoSector,
      { fkIdSector: sid },
      { lockMode: LockMode.PESSIMISTIC_WRITE, orderBy: { fkIdEvento: 'asc' } },
    );
    if (req.body.capacidad !== undefined) {
      const events = await tx.find(Evento, {
        fkIdEstadio: s.fkIdEstadio.idEstadio,
      });
      for (const e of events)
        if ((await occupied(tx, e.idEvento, sid)) > req.body.capacidad)
          throw new HttpError(
            409,
            'CAPACITY_CONFLICT',
            'La capacidad es menor al cupo ocupado',
          );
    }
    tx.assign(s, req.body);
    await tx.flush();
    return sectorDto(s);
  });
  return res.json(dto);
});
export const deleteSector = handler(async (req, res) => {
  await em().transactional(async (tx) => {
    const sid = id(req.params.id),
      s = await tx.findOne(
        Sector,
        { idSector: sid },
        { lockMode: LockMode.PESSIMISTIC_WRITE },
      );
    if (!s) throw new HttpError(404, 'NOT_FOUND', 'Sector no encontrado');
    if (
      (await tx.count(Entrada, { fkIdSector: sid })) ||
      (await tx.count(Compra, { sectorId: sid }))
    )
      throw new HttpError(409, 'IN_USE', 'El sector tiene compras o entradas');
    await tx.nativeDelete(Sector, { idSector: sid });
  });
  return res.sendStatus(204);
});
