import { Estadio } from '../entities/Estadio';
import { em, handler, id, pagination, list, HttpError } from '../lib/http';
import { stadiumDto } from '../lib/dto';
export const getAllEstadios = handler(async (req, res) => {
  const p = pagination(req),
    [rows, total] = await em().findAndCount(
      Estadio,
      {},
      { limit: p.limit, offset: p.offset, orderBy: { nombre: 'asc' } },
    );
  return res.json(list(rows.map(stadiumDto), total, p));
});
export const getEstadioById = handler(async (req, res) => {
  const c = await em().findOne(Estadio, { idEstadio: id(req.params.id) });
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Estadio no encontrado');
  return res.json(stadiumDto(c));
});
export const createEstadio = handler(async (req, res) => {
  const c = em().create(Estadio, req.body);
  await em().persistAndFlush(c);
  return res.status(201).json(stadiumDto(c));
});
export const updateEstadio = handler(async (req, res) => {
  const c = await em().findOne(Estadio, { idEstadio: id(req.params.id) });
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Estadio no encontrado');
  em().assign(c, req.body);
  await em().flush();
  return res.json(stadiumDto(c));
});
export const deleteEstadio = handler(async (req, res) => {
  if (!(await em().nativeDelete(Estadio, { idEstadio: id(req.params.id) })))
    throw new HttpError(404, 'NOT_FOUND', 'Estadio no encontrado');
  return res.sendStatus(204);
});
