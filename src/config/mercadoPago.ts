import {
  MercadoPagoConfig,
  Preference,
  Payment,
  PaymentRefund,
} from 'mercadopago';
import { getEnv } from './env';
import { PaymentGateway, ProviderPayment } from '../services/payments/types';
export type {
  PaymentGateway,
  ProviderPayment,
  PreferenceInput,
} from '../services/payments/types';
function normalize(p: {
  id?: number | string;
  status?: string;
  external_reference?: string;
  transaction_amount?: number;
  currency_id?: string;
  collector_id?: number | string;
  live_mode?: boolean;
}): ProviderPayment {
  return {
    provider: 'mercadopago',
    id: String(p.id),
    status: p.status ?? '',
    externalReference: p.external_reference ?? '',
    amount: String(p.transaction_amount ?? ''),
    currency: p.currency_id ?? '',
    collectorId: String(p.collector_id),
    liveMode: p.live_mode === true,
  };
}
let gateway: PaymentGateway | undefined;
export function getGateway(): PaymentGateway {
  if (getEnv().PAYMENT_MODE !== 'mercadopago')
    throw new Error('Mercado Pago está deshabilitado');
  if (gateway) return gateway;
  const env = getEnv(),
    client = new MercadoPagoConfig({
      accessToken: env.MERCADOPAGO_ACCESS_TOKEN!,
      options: { timeout: 10000 },
    }),
    payments = new Payment(client);
  gateway = {
    async createPreference(i) {
      const p = await new Preference(client).create({
        body: {
          items: [
            {
              id: String(i.compraId),
              title: 'Entradas Kicket',
              quantity: i.quantity,
              unit_price: Number(i.price),
              currency_id: 'ARS',
            },
          ],
          external_reference: String(i.compraId),
          notification_url: env.MERCADOPAGO_WEBHOOK_URL,
          expires: true,
          expiration_date_from: new Date().toISOString(),
          expiration_date_to: i.expiresAt.toISOString(),
          back_urls: {
            success: env.FRONTEND_URL + '/compra-exitosa',
            failure: env.FRONTEND_URL + '/compra-fallida',
            pending: env.FRONTEND_URL + '/compra-pendiente',
          },
          auto_return: 'approved',
          payment_methods: {
            excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }],
          },
        },
      });
      const url = env.MERCADOPAGO_LIVE_MODE
        ? p.init_point
        : p.sandbox_init_point;
      if (!p.id || !url) throw new Error('Respuesta incompleta');
      return { id: p.id, url };
    },
    async getPayment(id) {
      return normalize(await payments.get({ id }));
    },
    async searchPayments(compraId) {
      const found: ProviderPayment[] = [];
      for (let offset = 0; ; offset += 100) {
        const result = await payments.search({
          options: {
            external_reference: String(compraId),
            sort: 'date_created',
            criteria: 'desc',
            limit: 100,
            offset,
          },
        });
        const rows = result.results ?? [];
        found.push(...rows.map(normalize));
        if (rows.length < 100) break;
      }
      return found;
    },
    async refund(id, key) {
      await new PaymentRefund(client).create({
        payment_id: id,
        requestOptions: { idempotencyKey: key },
      });
    },
  };
  return gateway;
}
