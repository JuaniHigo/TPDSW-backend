import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  it,
  expect,
  vi,
} from 'vitest';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';
import request from 'supertest';
const require = createRequire(import.meta.url);
process.env.PAYMENT_MODE = 'demo';
for (const key of Object.keys(process.env))
  if (key.startsWith('MERCADOPAGO_')) delete process.env[key];
const { MikroORM } = require('@mikro-orm/mysql'),
  config = require('../../dist/mikro-orm.config').default;
const {
  Migration20260408150739: Initial,
} = require('../../dist/migrations/Migration20260408150739');
const {
  Migration20261111000000: Correction,
} = require('../../dist/migrations/Migration20261111000000');
const { createApp } = require('../../dist/app');
const { getEnv } = require('../../dist/config/env');
const {
  createCheckout,
  processPayment,
  reconcile,
} = require('../../dist/services/checkout');
const {
  createDemoGateway,
  demoPayment,
} = require('../../dist/services/payments/demo');
const { Club } = require('../../dist/entities/Club'),
  { Estadio } = require('../../dist/entities/Estadio'),
  { Sector } = require('../../dist/entities/Sector'),
  { Evento } = require('../../dist/entities/Evento'),
  { Usuario } = require('../../dist/entities/Usuario'),
  { PrecioEventoSector } = require('../../dist/entities/PrecioEventoSector'),
  { Compra } = require('../../dist/entities/Compra'),
  { Entrada } = require('../../dist/entities/Entrada'),
  { Pago } = require('../../dist/entities/Pago');
const jwt = require('jsonwebtoken');
let orm, app, root, f, network;
const dbName = 'kicket_test_' + Date.now();
function auth(id = f.user) {
  return {
    Authorization:
      'Bearer ' +
      jwt.sign({ idUsuario: id, sessionVersion: 0 }, getEnv().JWT_SECRET, {
        expiresIn: '1h',
      }),
  };
}
async function checkout(quantity = 1, key = randomUUID()) {
  return createCheckout(
    orm.em.fork(),
    f.user,
    { eventoId: f.event, sectorId: f.sector, quantity },
    key,
  );
}
const simulate = (id, resultado, user = f.user) =>
  request(app)
    .post('/api/pagos/demo/' + id + '/simular')
    .set(auth(user))
    .send({ resultado });
const getPurchase = (id) =>
  orm.em.fork().findOneOrFail(Compra, { idCompra: id });
beforeAll(async () => {
  root = await mysql.createConnection(
    process.env.MYSQL_TEST_URL || 'mysql://root:test-only@127.0.0.1:3307',
  );
  await root.query('CREATE DATABASE ' + dbName);
  orm = await MikroORM.init({
    ...config,
    host: root.config.host,
    port: root.config.port,
    user: root.config.user,
    password: root.config.password,
    dbName,
    migrations: { ...config.migrations, migrationsList: [Initial, Correction] },
  });
  await orm.migrator.up();
  app = createApp(orm, getEnv());
  // Supertest uses Node HTTP. Any outbound provider fetch fails the test.
  network = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
    throw Error('Unexpected external payment request');
  });
});
afterAll(async () => {
  network?.mockRestore();
  if (orm) await orm.close(true);
  if (root) {
    await root.query('DROP DATABASE IF EXISTS ' + dbName);
    await root.end();
  }
});
beforeEach(async () => {
  getEnv().PAYMENT_MODE = 'demo';
  getEnv().PURCHASES_ENABLED = true;
  network.mockClear();
  const em = orm.em.fork();
  for (const t of [
    'pago',
    'entrada',
    'compra',
    'precio_evento_sector',
    'evento',
    'sector',
    'estadio',
    'club',
    'usuario',
  ])
    await em.getConnection().execute('DELETE FROM ' + t);
  const home = em.create(Club, { nombre: 'Local' }),
    away = em.create(Club, { nombre: 'Away' }),
    stadium = em.create(Estadio, { nombre: 'Estadio' });
  em.persist([home, away, stadium]);
  await em.flush();
  const sector = em.create(Sector, {
    fkIdEstadio: stadium,
    nombreSector: 'Popular',
    capacidad: 2,
  });
  const event = em.create(Evento, {
    fkIdClubLocal: home,
    fkIdClubVisitante: away,
    fkIdEstadio: stadium,
    fechaHora: new Date(Date.now() + 86400000),
    estado: 'En Venta',
  });
  const user = em.create(Usuario, {
    dni: '12345678',
    nombre: 'Demo',
    apellido: 'User',
    email: 'demo@example.test',
    password: 'unused',
  });
  const other = em.create(Usuario, {
    dni: '87654321',
    nombre: 'Other',
    apellido: 'User',
    email: 'other@example.test',
    password: 'unused',
  });
  em.persist([sector, event, user, other]);
  await em.flush();
  em.persist(
    em.create(PrecioEventoSector, {
      fkIdEvento: event,
      fkIdSector: sector,
      precio: '10.00',
    }),
  );
  await em.flush();
  f = {
    event: event.idEvento,
    sector: sector.idSector,
    user: user.idUsuario,
    other: other.idUsuario,
  };
});
describe('persistent demo payments', () => {
  it('limits distinct pending checkouts but allows retries of the original purchase', async () => {
    await orm.em
      .fork()
      .nativeUpdate(Sector, { idSector: f.sector }, { capacidad: 100 });
    const post = (key) =>
      request(app)
        .post('/api/pagos/crear-preferencia')
        .set(auth())
        .set('Idempotency-Key', key)
        .send({ eventoId: f.event, sectorId: f.sector, quantity: 1 });
    const key = randomUUID();
    const first = await post(key).expect(201);
    for (let i = 0; i < 25; i++)
      expect((await post(key).expect(201)).body.idCompra).toBe(
        first.body.idCompra,
      );
    await post(randomUUID()).expect(201);
    await post(randomUUID()).expect(201);
    const fourth = await post(randomUUID()).expect(429);
    expect(fourth.body.code).toBe('TOO_MANY_PENDING');
    // Distinct failed requests still count toward the 20-request rate limit.
    for (let i = 0; i < 16; i++) await post(randomUUID()).expect(429);
    expect((await post(randomUUID()).expect(429)).body.code).toBe(
      'RATE_LIMITED',
    );
    expect((await post(key).expect(201)).body.idCompra).toBe(
      first.body.idCompra,
    );
    // The request limit is keyed by user, even when both users share an IP.
    await request(app)
      .post('/api/pagos/crear-preferencia')
      .set(auth(f.other))
      .set('Idempotency-Key', randomUUID())
      .send({ eventoId: f.event, sectorId: f.sector, quantity: 1 })
      .expect(201);
  });
  it('creates a credential-free checkout and returns public configuration', async () => {
    const response = await request(app)
      .get('/api/pagos/configuracion')
      .expect(200);
    expect(response.body).toEqual({ mode: 'demo', purchasesEnabled: true });
    const key = randomUUID();
    const created = await request(app)
      .post('/api/pagos/crear-preferencia')
      .set(auth())
      .set('Idempotency-Key', key)
      .send({ eventoId: f.event, sectorId: f.sector, quantity: 1 })
      .expect(201);
    expect(created.body.provider).toBe('demo');
    expect(created.body.preferenceId).toMatch(/^demo-/);
    expect(created.body.checkoutUrl).toContain(
      '/pago-demo/' + created.body.idCompra,
    );
    expect((await checkout(1, key)).idCompra).toBe(created.body.idCompra);
    expect((await getPurchase(created.body.idCompra)).metodoPago).toBe('demo');
    expect(network).not.toHaveBeenCalled();
  });
  it('transitions pending and rejected to approved, preserving data across new ORM contexts', async () => {
    const c = await checkout();
    await simulate(c.idCompra, 'pending').expect(200);
    expect(
      (
        await createDemoGateway(orm.em.fork()).getPayment(
          'demo-payment-' + c.idCompra,
        )
      ).status,
    ).toBe('pending');
    await simulate(c.idCompra, 'rejected').expect(200);
    expect((await getPurchase(c.idCompra)).estadoPago).toBe('rechazada');
    expect(await orm.em.fork().count(Entrada, {})).toBe(0);
    await simulate(c.idCompra, 'approved').expect(200);
    const tickets = await request(app)
      .get('/api/users/me/entradas')
      .set(auth())
      .expect(200);
    expect(tickets.body).toHaveLength(1);
    expect(tickets.body[0].esDemo).toBe(true);
    const restarted = await MikroORM.init({
      ...config,
      host: root.config.host,
      port: root.config.port,
      user: root.config.user,
      password: root.config.password,
      dbName,
    });
    try {
      expect(
        (
          await createDemoGateway(restarted.em.fork()).getPayment(
            'demo-payment-' + c.idCompra,
          )
        ).status,
      ).toBe('approved');
      await reconcile(restarted.em.fork());
    } finally {
      await restarted.close(true);
    }
    expect((await getPurchase(c.idCompra)).estadoPago).toBe('completada');
    expect(await orm.em.fork().count(Entrada, {})).toBe(1);
    expect(network).not.toHaveBeenCalled();
  });
  it('serializes duplicate approvals and rejects changes to completed purchases', async () => {
    const c = await checkout(2);
    const results = await Promise.all([
      simulate(c.idCompra, 'approved'),
      simulate(c.idCompra, 'approved'),
    ]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect(await orm.em.fork().count(Entrada, {})).toBe(2);
    expect(await orm.em.fork().count(Pago, {})).toBe(1);
    await simulate(c.idCompra, 'approved').expect(200);
    await simulate(c.idCompra, 'pending').expect(409);
    await simulate(c.idCompra, 'rejected').expect(409);
    const view = await request(app)
      .get('/api/pagos/demo/' + c.idCompra)
      .set(auth())
      .expect(200);
    expect(view.body.actions).toEqual([]);
  });
  it('does not oversell the last available place', async () => {
    await orm.em
      .fork()
      .nativeUpdate(Sector, { idSector: f.sector }, { capacidad: 1 });
    const results = await Promise.allSettled([checkout(), checkout()]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  });
  it('expires reservations and refunds late approvals locally', async () => {
    const c = await checkout(2);
    await orm.em
      .fork()
      .nativeUpdate(
        Compra,
        { idCompra: c.idCompra },
        { expiresAt: new Date(0) },
      );
    await reconcile(orm.em.fork());
    expect((await getPurchase(c.idCompra)).estadoPago).toBe('vencida');
    await checkout(2);
    const view = await request(app)
      .get('/api/pagos/demo/' + c.idCompra)
      .set(auth())
      .expect(200);
    expect(view.body.actions).toEqual(['approved']);
    await simulate(c.idCompra, 'pending').expect(409);
    await simulate(c.idCompra, 'approved').expect(200);
    expect((await getPurchase(c.idCompra)).estadoPago).toBe(
      'reembolsoPendiente',
    );
    expect(await orm.em.fork().count(Entrada, {})).toBe(0);
    await reconcile(orm.em.fork());
    expect((await getPurchase(c.idCompra)).estadoPago).toBe('reembolsada');
    await simulate(c.idCompra, 'approved').expect(200);
    await simulate(c.idCompra, 'rejected').expect(409);
    expect(network).not.toHaveBeenCalled();
  });
  it('refunds canceled-event approvals without tickets', async () => {
    const c = await checkout();
    await orm.em
      .fork()
      .nativeUpdate(Evento, { idEvento: f.event }, { estado: 'Cancelado' });
    await simulate(c.idCompra, 'rejected').expect(409);
    await simulate(c.idCompra, 'approved').expect(200);
    await reconcile(orm.em.fork());
    expect((await getPurchase(c.idCompra)).estadoPago).toBe('reembolsada');
    expect(await orm.em.fork().count(Entrada, {})).toBe(0);
  });
  it('enforces authentication, ownership, request validation and purchase switch', async () => {
    const c = await checkout();
    await request(app)
      .get('/api/pagos/demo/' + c.idCompra)
      .expect(401);
    await request(app)
      .post('/api/pagos/demo/' + c.idCompra + '/simular')
      .send({ resultado: 'approved' })
      .expect(401);
    await request(app)
      .get('/api/pagos/demo/' + c.idCompra)
      .set(auth(f.other))
      .expect(404);
    await simulate(c.idCompra, 'approved', f.other).expect(404);
    await request(app)
      .post('/api/pagos/demo/' + c.idCompra + '/simular')
      .set(auth())
      .send({ resultado: 'approved', amount: '0.01' })
      .expect(400);
    getEnv().PURCHASES_ENABLED = false;
    await simulate(c.idCompra, 'approved').expect(503);
    const view = await request(app)
      .get('/api/pagos/demo/' + c.idCompra)
      .set(auth())
      .expect(200);
    expect(view.body.actions).toEqual([]);
    await expect(checkout()).rejects.toMatchObject({ status: 503 });
    expect(await orm.em.fork().count(Entrada, {})).toBe(0);
  });
  it('keeps providers isolated when configuration changes', async () => {
    const c = await checkout();
    await request(app)
      .post('/api/pagos/webhook?data.id=123')
      .send({ type: 'payment' })
      .expect(404);
    await expect(
      processPayment(orm.em.fork(), {
        provider: 'mercadopago',
        id: '123',
        status: 'approved',
        externalReference: String(c.idCompra),
        amount: '10.00',
        currency: 'ARS',
        collectorId: '123',
        liveMode: false,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_PAYMENT' });
    await orm.em
      .fork()
      .nativeUpdate(
        Compra,
        { idCompra: c.idCompra },
        { metodoPago: 'mercadopago', expiresAt: new Date(0) },
      );
    await request(app)
      .get('/api/pagos/demo/' + c.idCompra)
      .set(auth())
      .expect(404);
    await simulate(c.idCompra, 'approved').expect(404);
    await expect(
      processPayment(
        orm.em.fork(),
        demoPayment(await getPurchase(c.idCompra), 'approved'),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_PAYMENT' });
    await reconcile(orm.em.fork());
    expect((await getPurchase(c.idCompra)).estadoPago).toBe('pendiente');
    await orm.em
      .fork()
      .nativeUpdate(Compra, { idCompra: c.idCompra }, { metodoPago: 'demo' });
    await simulate(c.idCompra, 'approved').expect(200);
    getEnv().PAYMENT_MODE = 'mercadopago';
    await request(app)
      .get('/api/pagos/demo/' + c.idCompra)
      .set(auth())
      .expect(404);
    await simulate(c.idCompra, 'approved').expect(404);
    // The worker still completes the persisted demo refund without initializing MP.
    await reconcile(orm.em.fork());
    expect((await getPurchase(c.idCompra)).estadoPago).toBe('reembolsada');
    expect(network).not.toHaveBeenCalled();
  });
});
