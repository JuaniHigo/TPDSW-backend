// src/config/mercadoPago.ts
import { MercadoPagoConfig } from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config();

const accessToken = process.env.MP_ACCESS_TOKEN;

if (!accessToken) {
  console.error('Error: MP_ACCESS_TOKEN no está definido en las variables de entorno.');
  process.exit(1);
}

export const client = new MercadoPagoConfig({ 
  accessToken, 
  options: { timeout: 5000 } 
});