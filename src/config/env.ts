import 'dotenv/config';
import { z } from 'zod';

const mercadoPagoFields = {
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1),
  MERCADOPAGO_WEBHOOK_URL: z.string().url(),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1),
  MERCADOPAGO_COLLECTOR_ID: z.string().regex(/^\d+$/),
};
export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PAYMENT_MODE: z.enum(['demo', 'mercadopago']).default('mercadopago'),
    PORT: z.coerce.number().int().positive().default(3000),
    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().positive().default(3306),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    FRONTEND_URL: z.string().url(),
    MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
    MERCADOPAGO_WEBHOOK_URL: z.string().optional(),
    MERCADOPAGO_WEBHOOK_SECRET: z.string().optional(),
    MERCADOPAGO_COLLECTOR_ID: z.string().optional(),
    MERCADOPAGO_LIVE_MODE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().positive().default(1025),
    SMTP_SECURE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().email(),
    PURCHASES_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
  })
  .superRefine((env, ctx) => {
    if (env.PAYMENT_MODE !== 'mercadopago') return;
    for (const [key, schema] of Object.entries(mercadoPagoFields)) {
      if (!schema.safeParse(env[key as keyof typeof mercadoPagoFields]).success)
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: 'Requerido para Mercado Pago',
        });
    }
    if (
      env.NODE_ENV === 'production' &&
      !env.MERCADOPAGO_WEBHOOK_URL?.startsWith('https://')
    )
      ctx.addIssue({
        code: 'custom',
        path: ['MERCADOPAGO_WEBHOOK_URL'],
        message: 'El webhook requiere HTTPS',
      });
  });
export type Environment = z.infer<typeof envSchema>;
let cached: Environment | undefined;
export function getEnv(): Environment {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success)
      throw new Error(
        'Configuración inválida: ' +
          parsed.error.issues.map((i) => i.path.join('.')).join(', '),
      );
    cached = parsed.data;
  }
  return cached;
}
