import { EntityManager } from '@mikro-orm/core';
import { Compra } from '../../entities/Compra';
import { Pago } from '../../entities/Pago';
import { getEnv } from '../../config/env';
import { HttpError } from '../../lib/http';
import { PaymentGateway, ProviderPayment } from './types';

export const demoPaymentId = (compraId: number) => 'demo-payment-' + compraId;
export function demoPayment(compra: Compra, status: string): ProviderPayment {
  return {
    provider: 'demo',
    id: demoPaymentId(compra.idCompra),
    status,
    externalReference: String(compra.idCompra),
    amount: compra.montoTotal,
    currency: compra.moneda,
  };
}
export function createDemoGateway(manager: EntityManager): PaymentGateway {
  async function record(id: string) {
    const p = await manager.findOne(
      Pago,
      { idPago: id, compra: { metodoPago: 'demo' } },
      { populate: ['compra'], refresh: true },
    );
    if (!p || id !== demoPaymentId(p.compra.idCompra))
      throw new HttpError(404, 'NOT_FOUND', 'Pago demo no encontrado');
    return p;
  }
  return {
    async createPreference({ compraId }) {
      return {
        id: 'demo-preference-' + compraId,
        url: getEnv().FRONTEND_URL + '/pago-demo/' + compraId,
      };
    },
    async getPayment(id) {
      const p = await record(id);
      return demoPayment(p.compra, p.estado);
    },
    async searchPayments(compraId) {
      const records = await manager.find(
        Pago,
        { compra: { idCompra: compraId, metodoPago: 'demo' } },
        { populate: ['compra'], refresh: true },
      );
      return records.map((p) => demoPayment(p.compra, p.estado));
    },
    async refund(id) {
      await record(
        id,
      ); /* The common worker persists the simulated refund atomically. */
    },
  };
}
