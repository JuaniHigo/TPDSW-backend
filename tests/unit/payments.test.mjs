import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { createHmac } from 'node:crypto';
const require = createRequire(import.meta.url);
const { cents, decimal } = require('../../dist/lib/money.js');
const {
  verifySignature,
  validatePayment,
} = require('../../dist/services/checkout.js');
describe('money', () => {
  it('keeps cents exact', () => {
    expect(decimal(cents('0.10') * 3)).toBe('0.30');
    expect(decimal(cents('123.4'))).toBe('123.40');
  });
  it('rejects malformed/unsafe amounts', () => {
    for (const v of ['1.001', '-1', 'NaN', '1e3'])
      expect(() => cents(v)).toThrow();
    expect(() => decimal(1.2)).toThrow();
  });
});
describe('payment trust boundary', () => {
  it('checks HMAC and rejects invalid signatures', () => {
    const manifest = 'id:123;request-id:req;ts:100;';
    const digest = createHmac('sha256', 'test-webhook')
      .update(manifest)
      .digest('hex');
    expect(
      verifySignature('ts=100,v1=' + digest, 'req', '123', 'test-webhook'),
    ).toBe(true);
    expect(
      verifySignature('ts=100,v1=' + digest, 'other', '123', 'test-webhook'),
    ).toBe(false);
    expect(
      verifySignature('ts=100,v1=nope', 'req', '123', 'test-webhook'),
    ).toBe(false);
  });
  it('checks reference, owner account, environment, amount and currency', () => {
    const c = {
      metodoPago: 'mercadopago',
      idCompra: 1,
      montoTotal: '10.00',
      moneda: 'ARS',
    };
    const payment = {
      provider: 'mercadopago',
      id: '5',
      status: 'approved',
      externalReference: '1',
      amount: '10',
      currency: 'ARS',
      collectorId: '123',
      liveMode: false,
    };
    expect(() => validatePayment(payment, c)).not.toThrow();
    for (const patch of [
      { externalReference: '2' },
      { amount: '9.99' },
      { currency: 'USD' },
      { collectorId: '999' },
      { liveMode: true },
    ])
      expect(() => validatePayment({ ...payment, ...patch }, c)).toThrow();
  });
});
