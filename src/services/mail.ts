import nodemailer from 'nodemailer';
import { getEnv } from '../config/env';
export interface Mailer {
  sendReset(email: string, token: string): Promise<void>;
}
export const mailer: Mailer = {
  async sendReset(email, token) {
    const e = getEnv();
    const transport = nodemailer.createTransport({
      host: e.SMTP_HOST,
      port: e.SMTP_PORT,
      secure: e.SMTP_SECURE,
      auth: e.SMTP_USER
        ? { user: e.SMTP_USER, pass: e.SMTP_PASSWORD }
        : undefined,
    });
    await transport.sendMail({
      from: e.SMTP_FROM,
      to: email,
      subject: 'Restablecer contraseña de Kicket',
      text:
        'Usá este enlace dentro de los próximos 30 minutos: ' +
        e.FRONTEND_URL +
        '/reset-password/' +
        token,
    });
  },
};
