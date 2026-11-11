import { Club } from '../entities/Club';
import { em, handler, id, pagination, list, HttpError } from '../lib/http';
import { clubDto } from '../lib/dto';
export const getAllClubes = handler(async (req, res) => {
  const p = pagination(req),
    [rows, total] = await em().findAndCount(
      Club,
      {},
      { limit: p.limit, offset: p.offset, orderBy: { nombre: 'asc' } },
    );
  return res.json(list(rows.map(clubDto), total, p));
});
export const getClubById = handler(async (req, res) => {
  const c = await em().findOne(Club, { idClub: id(req.params.id) });
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Club no encontrado');
  return res.json(clubDto(c));
});
export const createClub = handler(async (req, res) => {
  const c = em().create(Club, req.body);
  await em().persistAndFlush(c);
  return res.status(201).json(clubDto(c));
});
export const updateClub = handler(async (req, res) => {
  const c = await em().findOne(Club, { idClub: id(req.params.id) });
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Club no encontrado');
  em().assign(c, req.body);
  await em().flush();
  return res.json(clubDto(c));
});
export const deleteClub = handler(async (req, res) => {
  if (!(await em().nativeDelete(Club, { idClub: id(req.params.id) })))
    throw new HttpError(404, 'NOT_FOUND', 'Club no encontrado');
  return res.sendStatus(204);
});
