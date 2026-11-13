import { EntityManager, LockMode, IsolationLevel } from '@mikro-orm/core';
import { randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import { Compra } from '../entities/Compra';
import { Pago } from '../entities/Pago';
import { Evento, EventosEstado } from '../entities/Evento';
import { Sector } from '../entities/Sector';
import { PrecioEventoSector } from '../entities/PrecioEventoSector';
import { Entrada } from '../entities/Entrada';
import { Usuario } from '../entities/Usuario';
import { HttpError } from '../lib/http';
import { cents, decimal } from '../lib/money';
import { getEnv } from '../config/env';
import {
  PaymentGateway,
  ProviderPayment,
  PaymentProvider,
} from './payments/types';
import { getPaymentGateway } from './payments/gateway';
import { demoPaymentId } from './payments/demo';
export const reservingStates = ['pendiente', 'rechazada'];
const MAX_PENDING_PURCHASES = 3;
export async function occupied(
  tx: EntityManager,
  eventoId: number,
  sectorId: number,
  now = new Date(),
) {
  const sold = await tx.count(Entrada, {
    fkIdEvento: eventoId,
    fkIdSector: sectorId,
  });
  const reservations = await tx.find(Compra, {
    eventoId,
    sectorId,
    estadoPago: { $in: reservingStates },
    expiresAt: { $gt: now },
  });
  return sold + reservations.reduce((n, c) => n + (c.quantity ?? 0), 0);
}
export async function lockInventory(
  tx: EntityManager,
  eventoId: number,
  sectorId: number,
) {
  const event = await tx.findOne(
    Evento,
    { idEvento: eventoId },
    {
      lockMode: LockMode.PESSIMISTIC_WRITE,
      populate: ['fkIdClubLocal', 'fkIdClubVisitante', 'fkIdEstadio'],
      refresh: true,
    },
  );
  if (!event) throw new HttpError(404, 'NOT_FOUND', 'Evento no encontrado');
  const sector = await tx.findOne(
    Sector,
    { idSector: sectorId },
    { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true },
  );
  if (!sector || sector.fkIdEstadio.idEstadio !== event.fkIdEstadio.idEstadio)
    throw new HttpError(
      400,
      'INVALID_SECTOR',
      'El sector no pertenece al estadio',
    );
  const price = await tx.findOne(
    PrecioEventoSector,
    { fkIdEvento: eventoId, fkIdSector: sectorId },
    { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true },
  );
  if (!price) throw new HttpError(409, 'NO_PRICE', 'El sector no tiene precio');
  return { event, sector, price };
}
export async function createCheckout(
  manager: EntityManager,
  userId: number,
  input: { eventoId: number; sectorId: number; quantity: number },
  key: string,
  gateway: PaymentGateway = getPaymentGateway(getEnv().PAYMENT_MODE, manager),
) {
  if (!getEnv().PURCHASES_ENABLED)
    throw new HttpError(
      503,
      'PURCHASES_DISABLED',
      'Las compras están temporalmente deshabilitadas',
    );
  const matches = (c: Compra) =>
    c.fkUsuario.idUsuario === userId &&
    c.eventoId === input.eventoId &&
    c.sectorId === input.sectorId &&
    c.quantity === input.quantity &&
    c.metodoPago === getEnv().PAYMENT_MODE;
  let creator = false;
  let compra = await manager.transactional(
    async (tx) => {
      let existing = await tx.findOne(Compra, { idempotencyKey: key });
      if (existing) {
        if (!matches(existing))
          throw new HttpError(
            409,
            'IDEMPOTENCY_CONFLICT',
            'La clave ya corresponde a otra compra',
          );
        return existing;
      }
      // Serialize the per-user limit even when checkouts target different events.
      await tx.findOneOrFail(
        Usuario,
        { idUsuario: userId },
        {
          lockMode: LockMode.PESSIMISTIC_WRITE,
        },
      );
      const { event, sector, price } = await lockInventory(
        tx,
        input.eventoId,
        input.sectorId,
      );
      // Recheck after the inventory lock serializes requests for this event.
      existing = await tx.findOne(
        Compra,
        { idempotencyKey: key },
        { refresh: true },
      );
      if (existing) {
        if (!matches(existing))
          throw new HttpError(
            409,
            'IDEMPOTENCY_CONFLICT',
            'La clave ya corresponde a otra compra',
          );
        return existing;
      }
      if (
        (await tx.count(Compra, {
          fkUsuario: userId,
          estadoPago: 'pendiente',
          expiresAt: { $gt: new Date() },
        })) >= MAX_PENDING_PURCHASES
      )
        throw new HttpError(
          429,
          'TOO_MANY_PENDING',
          'Ya tenés el máximo de compras pendientes. Revisá el estado de tus compras',
        );
      if (
        event.estado !== EventosEstado['EN VENTA'] ||
        event.fechaHora.getTime() <= Date.now()
      )
        throw new HttpError(409, 'NOT_ON_SALE', 'El evento no está en venta');
      if (
        !sector.capacidad ||
        (await occupied(tx, input.eventoId, input.sectorId)) + input.quantity >
          sector.capacidad
      )
        throw new HttpError(409, 'SOLD_OUT', 'No hay cupo suficiente');
      const total = cents(price.precio) * input.quantity;
      if (total <= 0 || total > 9999999999)
        throw new HttpError(
          400,
          'INVALID_AMOUNT',
          'El importe está fuera de rango',
        );
      const c = tx.create(Compra, {
        fkUsuario: userId,
        ...input,
        precioUnitario: decimal(cents(price.precio)),
        montoTotal: decimal(total),
        metodoPago: getEnv().PAYMENT_MODE,
        estadoPago: 'pendiente',
        idempotencyKey: key,
        expiresAt: new Date(
          Math.min(Date.now() + 15 * 60000, event.fechaHora.getTime()),
        ),
        preferenceStatus: 'creating',
        snapshot: {
          nombreLocal: event.fkIdClubLocal.nombre,
          nombreVisitante: event.fkIdClubVisitante.nombre,
          logoLocal: event.fkIdClubLocal.logoUrl,
          logoVisitante: event.fkIdClubVisitante.logoUrl,
          nombreEstadio: event.fkIdEstadio.nombre,
          nombreSector: sector.nombreSector,
          fechaHora: event.fechaHora.toISOString(),
          torneo: event.torneo,
        },
      });
      await tx.persistAndFlush(c);
      creator = true;
      return c;
    },
    { isolationLevel: IsolationLevel.READ_COMMITTED },
  );
  if (creator) {
    try {
      const p = await gateway.createPreference({
        compraId: compra.idCompra,
        quantity: compra.quantity!,
        price: compra.precioUnitario!,
        expiresAt: compra.expiresAt!,
      });
      await manager.nativeUpdate(
        Compra,
        { idCompra: compra.idCompra },
        {
          idPreferenciaMp: p.id,
          checkoutUrl: p.url,
          preferenceStatus: 'ready',
        },
      );
    } catch {
      await manager.nativeUpdate(
        Compra,
        { idCompra: compra.idCompra },
        { preferenceStatus: 'unknown' },
      );
      throw new HttpError(
        503,
        'CHECKOUT_UNCERTAIN',
        'No pudimos confirmar el enlace de pago. La compra se revisará sin abrir otro cobro',
        { idCompra: compra.idCompra },
      );
    }
  }
  compra = (await manager.findOne(
    Compra,
    { idCompra: compra.idCompra },
    { refresh: true },
  ))!;
  if (
    !compra.expiresAt ||
    compra.expiresAt.getTime() <= Date.now() ||
    !reservingStates.includes(compra.estadoPago)
  )
    throw new HttpError(
      409,
      'CHECKOUT_CLOSED',
      'Esta compra ya no admite pagos',
      { idCompra: compra.idCompra },
    );
  if (!compra.checkoutUrl)
    throw new HttpError(
      409,
      'CHECKOUT_PENDING',
      'La creación del enlace sigue pendiente',
      { idCompra: compra.idCompra },
    );
  return {
    provider: compra.metodoPago as PaymentProvider,
    idCompra: compra.idCompra,
    preferenceId: compra.idPreferenciaMp,
    checkoutUrl: compra.checkoutUrl,
    expiresAt: compra.expiresAt.toISOString(),
  };
}
export function verifySignature(
  signature: string | undefined,
  requestId: string | undefined,
  dataId: string,
  secret: string,
) {
  if (!signature || !requestId) return false;
  const parts = Object.fromEntries(
    signature.split(',').map((p) => p.trim().split('=')),
  );
  if (
    !parts.ts ||
    !/^\d+$/.test(parts.ts) ||
    !parts.v1 ||
    !/^[a-fA-F0-9]{64}$/.test(parts.v1)
  )
    return false;
  const expected = createHmac('sha256', secret)
    .update(
      'id:' +
        dataId.toLowerCase() +
        ';request-id:' +
        requestId +
        ';ts:' +
        parts.ts +
        ';',
    )
    .digest('hex');
  return timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(parts.v1, 'hex'),
  );
}
export function validatePayment(payment: ProviderPayment, c: Compra) {
  const e = getEnv();
  let amount: number;
  try {
    amount = cents(payment.amount);
  } catch {
    throw new HttpError(400, 'INVALID_PAYMENT', 'Importe de pago inválido');
  }
  if (
    payment.provider !== c.metodoPago ||
    (payment.provider === 'mercadopago' &&
      (payment.collectorId !== e.MERCADOPAGO_COLLECTOR_ID ||
        payment.liveMode !== e.MERCADOPAGO_LIVE_MODE)) ||
    (payment.provider === 'demo' && payment.id !== demoPaymentId(c.idCompra)) ||
    payment.externalReference !== String(c.idCompra) ||
    payment.currency !== c.moneda ||
    amount !== cents(c.montoTotal)
  )
    throw new HttpError(
      400,
      'INVALID_PAYMENT',
      'El pago no corresponde a la compra',
    );
}
export async function processPayment(
  manager: EntityManager,
  p: ProviderPayment,
  options: { demoAction?: boolean } = {},
) {
  if (!/^\d+$/.test(p.externalReference))
    throw new HttpError(400, 'INVALID_PAYMENT', 'Referencia inválida');
  const initial = await manager.findOne(
    Compra,
    { idCompra: Number(p.externalReference) },
    { refresh: true },
  );
  if (!initial) throw new HttpError(404, 'NOT_FOUND', 'Compra no encontrada');
  validatePayment(p, initial);
  await manager.transactional(async (tx) => {
    // Lock inventory first everywhere, then purchase. Legacy rows have no inventory detail.
    let inventory: Awaited<ReturnType<typeof lockInventory>> | undefined;
    if (initial.eventoId && initial.sectorId)
      inventory = await lockInventory(tx, initial.eventoId, initial.sectorId);
    const c = (await tx.findOne(
      Compra,
      { idCompra: initial.idCompra },
      { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true },
    ))!;
    let record = await tx.findOne(
      Pago,
      { idPago: p.id },
      { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true },
    );
    if (p.provider === 'demo' && options.demoAction) {
      if (
        [
          'completada',
          'reembolsoPendiente',
          'reembolsada',
          'revision',
        ].includes(c.estadoPago)
      ) {
        if (p.status === 'approved' && c.estadoPago !== 'revision') return;
        throw new HttpError(
          409,
          'DEMO_PAYMENT_CLOSED',
          'Esta compra demo es de solo lectura',
        );
      }
      const expired =
        !c.expiresAt ||
        c.expiresAt.getTime() <= Date.now() ||
        inventory?.event.estado !== EventosEstado['EN VENTA'] ||
        inventory.event.fechaHora.getTime() <= Date.now();
      if (
        (expired || !reservingStates.includes(c.estadoPago)) &&
        p.status !== 'approved'
      )
        throw new HttpError(
          409,
          'DEMO_PAYMENT_CLOSED',
          'Solo se puede simular una aprobación tardía para esta compra',
        );
    }
    if (record && record.compra.idCompra !== c.idCompra)
      throw new HttpError(
        409,
        'PAYMENT_CONFLICT',
        'El pago ya corresponde a otra compra',
      );
    if (!record) {
      record = tx.create(Pago, { idPago: p.id, compra: c, estado: p.status });
      tx.persist(record);
    }
    // Provider refunds can be observed again by reconciliation.
    if (p.status === 'refunded') {
      record.estado = p.status;
      record.reembolso = 'done';
      if (
        c.estadoPago === 'reembolsoPendiente' &&
        (!c.idPagoMp || c.idPagoMp === p.id)
      )
        c.estadoPago = 'reembolsada';
      return;
    }
    if (record.reembolso === 'done') return;
    if (c.idPagoMp === p.id && c.estadoPago === 'completada') return;
    record.estado = p.status;
    if (p.status !== 'approved') {
      if (reservingStates.includes(c.estadoPago)) {
        if (p.status === 'rejected') c.estadoPago = 'rechazada';
        if (['pending', 'in_process'].includes(p.status))
          c.estadoPago = 'pendiente';
      }
      return;
    }
    if (
      c.estadoPago === 'completada' ||
      c.estadoPago === 'reembolsoPendiente' ||
      c.estadoPago === 'reembolsada'
    ) {
      record.reembolso = 'pending';
      return;
    }
    if (!inventory || !c.quantity || !c.snapshot || !c.expiresAt) {
      c.estadoPago = 'revision';
      record.reembolso = 'manual';
      return;
    }
    if (
      c.expiresAt.getTime() <= Date.now() ||
      inventory.event.estado !== EventosEstado['EN VENTA'] ||
      inventory.event.fechaHora.getTime() <= Date.now() ||
      !reservingStates.includes(c.estadoPago)
    ) {
      c.estadoPago = 'reembolsoPendiente';
      record.reembolso = 'pending';
      return;
    }
    if (
      !inventory.sector.capacidad ||
      (await occupied(tx, c.eventoId!, c.sectorId!)) >
        inventory.sector.capacidad
    ) {
      c.estadoPago = 'reembolsoPendiente';
      record.reembolso = 'pending';
      return;
    }
    c.estadoPago = 'completada';
    c.idPagoMp = p.id;
    for (let i = 0; i < c.quantity; i++)
      tx.persist(
        tx.create(Entrada, {
          fkIdCompra: c,
          fkIdEvento: c.eventoId!,
          fkIdSector: c.sectorId!,
          codigoQr: randomUUID(),
        }),
      );
  });
}
export async function reconcile(
  manager: EntityManager,
  gateway?: PaymentGateway,
) {
  const providers: PaymentProvider[] =
    getEnv().PAYMENT_MODE === 'demo' ? ['demo'] : ['demo', 'mercadopago'];
  const resolveGateway = (provider: PaymentProvider) =>
    provider === 'mercadopago' && gateway
      ? gateway
      : getPaymentGateway(provider, manager);
  // Scan by primary key so old unresolved rows cannot starve newer purchases.
  const since = new Date(Date.now() - 48 * 60 * 60000);
  let after = 0;
  for (;;) {
    const purchases = await manager.find(
      Compra,
      {
        idCompra: { $gt: after },
        eventoId: { $ne: null },
        metodoPago: { $in: providers },
        $or: [
          { fechaCompra: { $gte: since } },
          { estadoPago: 'reembolsoPendiente' },
        ],
        estadoPago: {
          $in: [
            'pendiente',
            'rechazada',
            'vencida',
            'cancelada',
            'reembolsoPendiente',
            'completada',
          ],
        },
      },
      { orderBy: { idCompra: 'asc' }, limit: 100 },
    );
    if (!purchases.length) break;
    for (const c of purchases) {
      try {
        // Demo actions already persist their result atomically. Replaying a
        // previously read demo result could overwrite a newer user action.
        if (c.metodoPago === 'mercadopago') {
          for (const p of await resolveGateway('mercadopago').searchPayments(
            c.idCompra,
          ))
            await processPayment(manager, p);
        }
      } catch {
        console.error('PAYMENT_RECONCILIATION_FAILED compra=' + c.idCompra);
      }
      if (c.expiresAt && c.expiresAt.getTime() <= Date.now())
        await manager.nativeUpdate(
          Compra,
          { idCompra: c.idCompra, estadoPago: { $in: reservingStates } },
          { estadoPago: 'vencida' },
        );
    }
    after = purchases[purchases.length - 1].idCompra;
  }
  const refunds = await manager.find(
    Pago,
    {
      reembolso: 'pending',
      compra: { metodoPago: { $in: providers } },
      $or: [{ nextRetryAt: null }, { nextRetryAt: { $lte: new Date() } }],
    },
    { limit: 100, orderBy: { createdAt: 'asc' }, populate: ['compra'] },
  );
  for (const p of refunds) {
    try {
      await resolveGateway(p.compra.metodoPago as PaymentProvider).refund(
        p.idPago,
        'kicket-refund-' + p.idPago,
      );
      await manager.transactional(async (tx) => {
        const payment = (await tx.findOne(
          Pago,
          { idPago: p.idPago },
          { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true },
        ))!;
        payment.reembolso = 'done';
        payment.estado = 'refunded';
        await tx.nativeUpdate(
          Compra,
          {
            idCompra: payment.compra.idCompra,
            estadoPago: 'reembolsoPendiente',
          },
          { estadoPago: 'reembolsada' },
        );
      });
    } catch {
      await manager.nativeUpdate(
        Pago,
        { idPago: p.idPago },
        {
          attempts: p.attempts + 1,
          nextRetryAt: new Date(
            Date.now() + Math.min(60, 2 ** Math.min(p.attempts, 6)) * 60000,
          ),
        },
      );
      console.error('REFUND_RETRY payment=' + p.idPago);
    }
  }
}
