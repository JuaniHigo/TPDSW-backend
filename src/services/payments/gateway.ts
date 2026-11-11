import { EntityManager } from '@mikro-orm/core';
import { getGateway } from '../../config/mercadoPago';
import { getEnv } from '../../config/env';
import { createDemoGateway } from './demo';
import { PaymentProvider, PaymentGateway } from './types';
export function getPaymentGateway(
  provider: PaymentProvider,
  manager: EntityManager,
): PaymentGateway {
  if (provider === 'demo') return createDemoGateway(manager);
  if (getEnv().PAYMENT_MODE !== 'mercadopago')
    throw new Error('Mercado Pago está deshabilitado');
  return getGateway();
}
