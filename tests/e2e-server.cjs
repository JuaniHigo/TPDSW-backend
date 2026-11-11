// Test-only harness. The application uses its persistent demo provider.
(async () => {
  await import('./env.mjs');
  process.env.FRONTEND_URL = 'http://127.0.0.1:5174';
  process.env.PAYMENT_MODE = 'demo';
  for (const key of Object.keys(process.env))
    if (key.startsWith('MERCADOPAGO_')) delete process.env[key];
  const mysql = require('mysql2/promise'),
    bcrypt = require('bcryptjs'),
    express = require('express');
  const { MikroORM } = require('@mikro-orm/mysql'),
    config = require('../dist/mikro-orm.config').default;
  const {
    Migration20260408150739: Initial,
  } = require('../dist/migrations/Migration20260408150739');
  const {
    Migration20261111000000: Correction,
  } = require('../dist/migrations/Migration20261111000000');
  const { getEnv } = require('../dist/config/env'),
    { Usuario } = require('../dist/entities/Usuario');
  const root = await mysql.createConnection(
    process.env.MYSQL_TEST_URL || 'mysql://root:test-only@127.0.0.1:3307',
  );
  const dbName = 'kicket_test_e2e_' + Date.now();
  await root.query('CREATE DATABASE ' + dbName);
  const orm = await MikroORM.init({
    ...config,
    host: root.config.host,
    port: root.config.port,
    user: root.config.user,
    password: root.config.password,
    dbName,
    migrations: { ...config.migrations, migrationsList: [Initial, Correction] },
  });
  let server,
    closing = false;
  const cleanup = async () => {
    if (closing) return;
    closing = true;
    if (server) await new Promise((resolve) => server.close(resolve));
    await orm.close(true);
    await root.query('DROP DATABASE ' + dbName);
    await root.end();
  };
  process.on('SIGINT', () => void cleanup());
  process.on('SIGTERM', () => void cleanup());
  try {
    await orm.migrator.up();
    const em = orm.em.fork();
    em.persist(
      em.create(Usuario, {
        dni: '99999999',
        nombre: 'Admin',
        apellido: 'Test',
        email: 'admin@kicket.test',
        password: await bcrypt.hash('password123', 12),
        rol: 'admin',
      }),
    );
    await em.flush();
    const app = express();
    // Playwright on Windows may terminate the process tree without SIGTERM.
    // Explicit teardown keeps temporary databases from surviving a test run.
    app.post('/test-cleanup', async (_req, res, next) => {
      if (closing) {
        res.sendStatus(409);
        return;
      }
      closing = true;
      try {
        await orm.close(true);
        await root.query('DROP DATABASE ' + dbName);
        await root.end();
        res.json({ cleaned: true });
        server.close();
      } catch (error) {
        next(error);
      }
    });
    app.use(require('../dist/app').createApp(orm, getEnv()));
    server = app.listen(5180, '127.0.0.1', () =>
      console.log('Test backend ready'),
    );
  } catch (error) {
    await cleanup();
    throw error;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
