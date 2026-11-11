import { z } from 'zod';
import { em, handler, HttpError, id } from '../lib/http';
import { Compra } from '../entities/Compra';
import { Entrada } from '../entities/Entrada';
import { getEnv } from '../config/env';
import { getGateway } from '../config/mercadoPago';
import {
  createCheckout,
  processPayment,
  verifySignature,
} from '../services/checkout';
import { purchaseDto, ticketDto } from '../lib/dto';
import { demoPayment } from '../services/payments/demo';
import { Evento, EventosEstado } from '../entities/Evento';
export const getConfiguracion = handler(async (_req, res) =>
  res.json({
    mode: getEnv().PAYMENT_MODE,
    purchasesEnabled: getEnv().PURCHASES_ENABLED,
  }),
);
export const crearPreferencia = handler(async (req, res) => {
  const input = z
    .object({
      eventoId: z.number().int().positive(),
      sectorId: z.number().int().positive(),
      quantity: z.number().int().min(1).max(100),
    })
    .parse(req.body);
  const key = z.string().uuid().parse(req.get('Idempotency-Key'));
  return res
    .status(201)
    .json(await createCheckout(em(), req.user!.idUsuario, input, key));
});
async function owned(compraId: unknown, userId: number) {
  const c = await em().findOne(Compra, {
    idCompra: id(compraId),
    fkUsuario: userId,
  });
  if (!c) throw new HttpError(404, 'NOT_FOUND', 'Compra no encontrada');
  return c;
}
async function ownedDemo(compraId: unknown, userId: number) {
  if (getEnv().PAYMENT_MODE !== 'demo')
    throw new HttpError(404, 'NOT_FOUND', 'Compra demo no encontrada');
  const c = await owned(compraId, userId);
  if (c.metodoPago !== 'demo')
    throw new HttpError(404, 'NOT_FOUND', 'Compra demo no encontrada');
  return c;
}
async function demoActions(c: Compra): Promise<string[]> {
  if (
    !getEnv().PURCHASES_ENABLED ||
    ['completada', 'reembolsada', 'reembolsoPendiente', 'revision'].includes(
      c.estadoPago,
    )
  )
    return [];
  const event = c.eventoId
    ? await em().findOne(Evento, { idEvento: c.eventoId })
    : null;
  if (
    !c.expiresAt ||
    c.expiresAt.getTime() <= Date.now() ||
    event?.estado !== EventosEstado['EN VENTA'] ||
    event.fechaHora.getTime() <= Date.now() ||
    ['vencida', 'cancelada'].includes(c.estadoPago)
  )
    return ['approved'];
  return ['approved', 'rejected', 'pending'];
}
export const getDemo = handler(async (req, res) => {
  const c = await ownedDemo(req.params.idCompra, req.user!.idUsuario);
  return res.json({ ...purchaseDto(c), actions: await demoActions(c) });
});
export const simularDemo = handler(async (req, res) => {
  const c = await ownedDemo(req.params.idCompra, req.user!.idUsuario);
  if (!getEnv().PURCHASES_ENABLED)
    throw new HttpError(
      503,
      'PURCHASES_DISABLED',
      'Las compras están temporalmente deshabilitadas',
    );
  const { resultado } = z
    .object({ resultado: z.enum(['approved', 'rejected', 'pending']) })
    .strict()
    .parse(req.body);
  await processPayment(em(), demoPayment(c, resultado), { demoAction: true });
  const updated = (await em().findOne(
    Compra,
    { idCompra: c.idCompra },
    { refresh: true },
  ))!;
  return res.json(purchaseDto(updated));
});
export const getCompra = handler(async (req, res) =>
  res.json(purchaseDto(await owned(req.params.idCompra, req.user!.idUsuario))),
);
export const getEntradasPorCompra = handler(async (req, res) => {
  const c = await owned(req.params.idCompra, req.user!.idUsuario);
  const tickets = await em().find(
    Entrada,
    { fkIdCompra: c.idCompra },
    {
      populate: [
        'fkIdCompra',
        'fkIdSector',
        'fkIdEvento.fkIdClubLocal',
        'fkIdEvento.fkIdClubVisitante',
      ],
    },
  );
  return res.json(tickets.map(ticketDto));
});
export const recibirConfirmacionPago = handler(async (req, res) => {
  if (getEnv().PAYMENT_MODE !== 'mercadopago')
    throw new HttpError(404, 'NOT_FOUND', 'Ruta no encontrada');
  const dataId = z
    .string()
    .regex(/^\d+$/)
    .parse(req.query['data.id'] ?? String(req.body?.data?.id ?? ''));
  if (
    !verifySignature(
      req.get('x-signature'),
      req.get('x-request-id'),
      dataId,
      getEnv().MERCADOPAGO_WEBHOOK_SECRET!,
    )
  )
    throw new HttpError(401, 'INVALID_SIGNATURE', 'Firma inválida');
  if (req.body?.type && req.body.type !== 'payment') return res.sendStatus(204);
  const payment = await getGateway().getPayment(dataId);
  await processPayment(em(), payment);
  return res.json({ received: true });
});
