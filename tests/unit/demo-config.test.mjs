import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { envSchema } = require('../../dist/config/env.js');
const withoutCredentials = () =>
  Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !key.startsWith('MERCADOPAGO_'),
    ),
  );
describe('payment configuration', () => {
  it('accepts demo without payment credentials in development and production', () => {
    for (const NODE_ENV of ['development', 'production'])
      expect(
        envSchema.safeParse({
          ...withoutCredentials(),
          PAYMENT_MODE: 'demo',
          NODE_ENV,
        }).success,
      ).toBe(true);
  });
  it('requires complete official credentials by default', () => {
    const env = withoutCredentials();
    delete env.PAYMENT_MODE;
    const result = envSchema.safeParse(env);
    expect(result.success).toBe(false);
    expect(
      result.error.issues.some((i) => i.path[0] === 'MERCADOPAGO_ACCESS_TOKEN'),
    ).toBe(true);
  });
  it('validates official configuration and rejects invalid mode', () => {
    expect(
      envSchema.safeParse({ ...process.env, PAYMENT_MODE: 'mercadopago' })
        .success,
    ).toBe(true);
    expect(
      envSchema.safeParse({ ...process.env, PAYMENT_MODE: 'automatic' })
        .success,
    ).toBe(false);
    expect(
      envSchema.safeParse({
        ...process.env,
        PAYMENT_MODE: 'mercadopago',
        NODE_ENV: 'production',
        MERCADOPAGO_WEBHOOK_URL: 'http://localhost/webhook',
      }).success,
    ).toBe(false);
  });
});
