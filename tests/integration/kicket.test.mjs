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
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import mysql from 'mysql2/promise';
import request from 'supertest';
const require = createRequire(import.meta.url);
const { MikroORM } = require('@mikro-orm/mysql');
const config = require('../../dist/mikro-orm.config.js').default;
const {
  Migration20260408150739: Initial,
} = require('../../dist/migrations/Migration20260408150739.js');
const {
  Migration20261111000000: Correction,
} = require('../../dist/migrations/Migration20261111000000.js');
const { createApp } = require('../../dist/app.js');
const { getEnv } = require('../../dist/config/env.js');
const {
  createCheckout,
  occupied,
  processPayment,
  reconcile,
} = require('../../dist/services/checkout.js');
const { mailer } = require('../../dist/services/mail.js');
const { Club } = require('../../dist/entities/Club.js'),
  { Estadio } = require('../../dist/entities/Estadio.js'),
  { Sector } = require('../../dist/entities/Sector.js'),
  { Evento } = require('../../dist/entities/Evento.js'),
  { Usuario } = require('../../dist/entities/Usuario.js'),
  { PrecioEventoSector } = require('../../dist/entities/PrecioEventoSector.js'),
  { Compra } = require('../../dist/entities/Compra.js'),
  { Entrada } = require('../../dist/entities/Entrada.js'),
  { Pago } = require('../../dist/entities/Pago.js');
let orm, app, root, fixture;
const dbName = 'kicket_test_' + Date.now();
const gateway = {
  async createPreference({ compraId }) {
    return {
      id: 'pref-' + compraId,
      url: 'https://example.test/pay/' + compraId,
    };
  },
  async getPayment() {
    throw Error('unused');
  },
  async searchPayments() {
    return [];
  },
  async refund() {},
};
const approved = (c) => ({
  provider: 'mercadopago',
  id: 'payment-' + c.idCompra,
  status: 'approved',
  externalReference: String(c.idCompra),
  amount: c.montoTotal,
  currency: 'ARS',
  collectorId: '123',
  liveMode: false,
});
async function freshFixture() {
  const em = orm.em.fork();
  const home = em.create(Club, { nombre: 'Local' }),
    away = em.create(Club, { nombre: 'Visitante' }),
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
    nombre: 'Test',
    apellido: 'User',
    email: 'test@example.test',
    password: 'unused',
  });
  em.persist([sector, event, user]);
  await em.flush();
  em.persist(
    em.create(PrecioEventoSector, {
      fkIdEvento: event,
      fkIdSector: sector,
      precio: '10.00',
    }),
  );
  await em.flush();
  return {
    event: event.idEvento,
    sector: sector.idSector,
    user: user.idUsuario,
  };
}
async function checkout(quantity = 1, key = randomUUID(), g = gateway) {
  const result = await createCheckout(
    orm.em.fork(),
    fixture.user,
    { eventoId: fixture.event, sectorId: fixture.sector, quantity },
    key,
    g,
  );
  return orm.em.fork().findOneOrFail(Compra, { idCompra: result.idCompra });
}
beforeAll(async () => {
  const url =
    process.env.MYSQL_TEST_URL || 'mysql://root:test-only@127.0.0.1:3307';
  root = await mysql.createConnection(url);
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
});
afterAll(async () => {
  if (orm) await orm.close(true);
  if (root) {
    await root.query('DROP DATABASE IF EXISTS ' + dbName);
    await root.end();
  }
});
beforeEach(async () => {
  const em = orm.em.fork();
  for (const table of [
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
    await em.getConnection().execute('DELETE FROM ' + table);
  fixture = await freshFixture();
});
describe('reservations and payments with MySQL', () => {
  it('serializes the pending limit across different events', async () => {
    const em = orm.em.fork();
    const original = await em.findOneOrFail(Evento, fixture.event);
    const inventories = [{ eventoId: fixture.event, sectorId: fixture.sector }];
    for (let i = 0; i < 3; i++) {
      const event = em.create(Evento, {
        fkIdClubLocal: original.fkIdClubLocal,
        fkIdClubVisitante: original.fkIdClubVisitante,
        fkIdEstadio: original.fkIdEstadio,
        fechaHora: original.fechaHora,
        estado: original.estado,
      });
      await em.persistAndFlush(event);
      const sector = em.create(Sector, {
        fkIdEstadio: original.fkIdEstadio,
        nombreSector: 'Concurrent ' + i,
        capacidad: 2,
      });
      await em.persistAndFlush(sector);
      await em.persistAndFlush(
        em.create(PrecioEventoSector, {
          fkIdEvento: event,
          fkIdSector: sector,
          precio: '10.00',
        }),
      );
      inventories.push({ eventoId: event.idEvento, sectorId: sector.idSector });
    }
    const results = await Promise.allSettled(
      inventories.map((inventory) =>
        createCheckout(
          orm.em.fork(),
          fixture.user,
          { ...inventory, quantity: 1 },
          randomUUID(),
          gateway,
        ),
      ),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(3);
    expect(results.find((r) => r.status === 'rejected').reason).toMatchObject({
      code: 'TOO_MANY_PENDING',
    });
  });
  it('only reconciles recent purchases and old pending refunds', async () => {
    const em = orm.em.fork();
    const purchases = [];
    for (const [estadoPago, hours] of [
      ['completada', 49],
      ['completada', 47],
      ['reembolsoPendiente', 72],
    ]) {
      const c = await checkout();
      await em.nativeUpdate(
        Compra,
        { idCompra: c.idCompra },
        {
          estadoPago,
          fechaCompra: new Date(Date.now() - hours * 3600000),
        },
      );
      purchases.push(c.idCompra);
    }
    const searched = [];
    await reconcile(orm.em.fork(), {
      ...gateway,
      async searchPayments(id) {
        searched.push(id);
        return [];
      },
    });
    expect(searched).toEqual(purchases.slice(1));
  });
  it('serializes two buyers competing for the last ticket', async () => {
    await orm.em
      .fork()
      .nativeUpdate(Sector, { idSector: fixture.sector }, { capacidad: 1 });
    const results = await Promise.allSettled([checkout(), checkout()]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await orm.em.fork().count(Compra, {})).toBe(1);
  });
  it('reuses an idempotency key and rejects changed content', async () => {
    const key = randomUUID(),
      a = await checkout(1, key),
      b = await checkout(1, key);
    expect(a.idCompra).toBe(b.idCompra);
    await expect(checkout(2, key)).rejects.toMatchObject({
      code: 'IDEMPOTENCY_CONFLICT',
    });
  });
  it('handles duplicate simultaneous webhooks without duplicate tickets', async () => {
    const c = await checkout(2),
      p = approved(c);
    await Promise.all([
      processPayment(orm.em.fork(), p),
      processPayment(orm.em.fork(), p),
    ]);
    expect(await orm.em.fork().count(Entrada, {})).toBe(2);
    expect(await orm.em.fork().count(Pago, {})).toBe(1);
    const tickets = await orm.em.fork().find(Entrada, {});
    expect(tickets.every((t) => /^[a-f0-9-]{36}$/.test(t.codigoQr))).toBe(true);
  });
  it('does not trust incorrect payment data', async () => {
    const c = await checkout();
    await expect(
      processPayment(orm.em.fork(), { ...approved(c), amount: '0.01' }),
    ).rejects.toMatchObject({ code: 'INVALID_PAYMENT' });
    expect(await orm.em.fork().count(Entrada, {})).toBe(0);
  });
  it('releases expired capacity and refunds a late payment', async () => {
    const c = await checkout(2);
    await orm.em
      .fork()
      .nativeUpdate(
        Compra,
        { idCompra: c.idCompra },
        { expiresAt: new Date(Date.now() - 1000) },
      );
    await checkout(2);
    await processPayment(orm.em.fork(), approved(c));
    expect(await orm.em.fork().count(Entrada, {})).toBe(0);
    expect(
      (await orm.em.fork().findOneOrFail(Pago, { idPago: approved(c).id }))
        .reembolso,
    ).toBe('pending');
    const refunds = [];
    await reconcile(orm.em.fork(), {
      ...gateway,
      async refund(id, key) {
        refunds.push([id, key]);
      },
    });
    expect(refunds).toHaveLength(1);
    expect(
      (await orm.em.fork().findOneOrFail(Compra, { idCompra: c.idCompra }))
        .estadoPago,
    ).toBe('reembolsada');
  });
  it('refunds a second approved payment and retries provider failures', async () => {
    const c = await checkout();
    await processPayment(orm.em.fork(), approved(c));
    await processPayment(orm.em.fork(), { ...approved(c), id: 'extra' });
    await reconcile(orm.em.fork(), {
      ...gateway,
      async refund() {
        throw Error('timeout');
      },
    });
    expect(
      (await orm.em.fork().findOneOrFail(Pago, { idPago: 'extra' })).attempts,
    ).toBe(1);
    await orm.em
      .fork()
      .nativeUpdate(Pago, { idPago: 'extra' }, { nextRetryAt: new Date(0) });
    await reconcile(orm.em.fork(), gateway);
    expect(
      (await orm.em.fork().findOneOrFail(Pago, { idPago: 'extra' })).reembolso,
    ).toBe('done');
    expect(await orm.em.fork().count(Entrada, {})).toBe(1);
  });
  it('does not create another checkout after an ambiguous timeout', async () => {
    const key = randomUUID();
    let calls = 0;
    const broken = {
      ...gateway,
      async createPreference() {
        calls++;
        throw Error('timeout');
      },
    };
    await expect(checkout(1, key, broken)).rejects.toMatchObject({
      code: 'CHECKOUT_UNCERTAIN',
    });
    await expect(checkout(1, key, broken)).rejects.toMatchObject({
      code: 'CHECKOUT_PENDING',
    });
    expect(calls).toBe(1);
  });
});
describe('HTTP authentication and account', () => {
  it('returns the same response for unknown accounts and wrong passwords', async () => {
    await account();
    const compare = vi.spyOn(require('bcryptjs'), 'compare');
    try {
      const wrong = await request(app)
        .post('/api/auth/login')
        .send({ email: 'person@example.test', password: 'wrong-password' })
        .expect(401);
      const missing = await request(app)
        .post('/api/auth/login')
        .send({ email: 'missing@example.test', password: 'wrong-password' })
        .expect(401);
      expect(missing.body).toEqual(wrong.body);
      expect(compare).toHaveBeenCalledTimes(2);
      expect(compare.mock.calls[1][1]).toMatch(/^\$2b\$12\$/);
    } finally {
      compare.mockRestore();
    }
  });
  it('does not disclose which registration field is duplicated', async () => {
    const data = {
      dni: '12345678',
      nombre: 'Test',
      apellido: 'User',
      email: 'new@example.test',
      password: 'password123',
    };
    const duplicateDni = await request(app)
      .post('/api/auth/register')
      .send(data)
      .expect(409);
    const duplicateEmail = await request(app)
      .post('/api/auth/register')
      .send({ ...data, dni: '23456789', email: 'test@example.test' })
      .expect(409);
    expect(duplicateEmail.body).toEqual(duplicateDni.body);
    expect(duplicateEmail.body.code).toBe('CONFLICT');
  });
  async function account(email = 'person@example.test') {
    await request(app)
      .post('/api/auth/register')
      .send({
        dni: '87654321',
        nombre: 'Persona',
        apellido: 'Prueba',
        email,
        password: 'password123',
        rol: 'admin',
      })
      .expect(201);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    return login.body;
  }
  it('registers a user, restores session and enforces role/ownership', async () => {
    const { token, user } = await account();
    expect(user.rol).toBe('user');
    expect(user.password).toBeUndefined();
    await request(app)
      .get('/api/users/me')
      .auth(token, { type: 'bearer' })
      .expect(200);
    await request(app)
      .post('/api/clubes')
      .auth(token, { type: 'bearer' })
      .send({ nombre: 'Bad' })
      .expect(403);
    const c = await checkout();
    await request(app)
      .get('/api/pagos/compras/' + c.idCompra)
      .auth(token, { type: 'bearer' })
      .expect(404);
    await request(app).get('/api/users/me').expect(401);
    const update = await request(app)
      .patch('/api/users/me')
      .auth(token, { type: 'bearer' })
      .send({ nombre: 'Nuevo' })
      .expect(200);
    expect(update.body.nombre).toBe('Nuevo');
    await request(app)
      .post('/api/users/me/password')
      .auth(token, { type: 'bearer' })
      .send({ currentPassword: 'wrong', password: 'password456' })
      .expect(400);
    await request(app)
      .post('/api/users/me/password')
      .auth(token, { type: 'bearer' })
      .send({ currentPassword: 'password123', password: 'password456' })
      .expect(200);
    await request(app)
      .get('/api/users/me')
      .auth(token, { type: 'bearer' })
      .expect(401);
  });
  it('uses reset tokens once and invalidates old sessions', async () => {
    const { token } = await account();
    let raw;
    const original = mailer.sendReset;
    mailer.sendReset = async (_email, t) => {
      raw = t;
    };
    try {
      const known = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'person@example.test' })
        .expect(200);
      const unknown = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'missing@example.test' })
        .expect(200);
      expect(known.body).toEqual(unknown.body);
      expect(raw).toHaveLength(64);
      await request(app)
        .post('/api/auth/reset-password/' + raw)
        .send({ password: 'password456' })
        .expect(200);
      await request(app)
        .post('/api/auth/reset-password/' + raw)
        .send({ password: 'password789' })
        .expect(400);
      await request(app)
        .get('/api/users/me')
        .auth(token, { type: 'bearer' })
        .expect(401);
    } finally {
      mailer.sendReset = original;
    }
  });
  it('handles expired reset links and SMTP failures without leaking existence', async () => {
    await account();
    let raw;
    const original = mailer.sendReset;
    mailer.sendReset = async (_e, t) => {
      raw = t;
    };
    try {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'person@example.test' })
        .expect(200);
      await orm.em
        .fork()
        .nativeUpdate(
          Usuario,
          { email: 'person@example.test' },
          { resetExpiresAt: new Date(0) },
        );
      await request(app)
        .post('/api/auth/reset-password/' + raw)
        .send({ password: 'password456' })
        .expect(400);
      mailer.sendReset = async () => {
        throw Error('smtp');
      };
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'person@example.test' })
        .expect(200);
      expect(
        (
          await orm.em
            .fork()
            .findOneOrFail(Usuario, { email: 'person@example.test' })
        ).resetTokenHash,
      ).toBeNull();
    } finally {
      mailer.sendReset = original;
    }
  });
  it('validates pagination, filters sectors, and removes simulated payments', async () => {
    await request(app).get('/api/eventos?limit=101').expect(400);
    const response = await request(app)
      .get('/api/sectores?fkIdEstadio=99999')
      .expect(200);
    expect(response.body.data).toEqual([]);
    await request(app).post('/api/pagos/procesar-tarjeta').send({}).expect(404);
    await request(app).get('/health').expect(200);
    await request(app).get('/ready').expect(200);
  });
});
describe('incremental migration safeguards', () => {
  it('requires explicit mapping for legacy prices and preserves rows', async () => {
    const legacyName = dbName + '_legacy';
    await root.query('CREATE DATABASE ' + legacyName);
    const old = await MikroORM.init({
      ...config,
      host: root.config.host,
      port: root.config.port,
      user: root.config.user,
      password: root.config.password,
      dbName: legacyName,
      migrations: { ...config.migrations, migrationsList: [Initial] },
    });
    const file = join(tmpdir(), 'kicket-map-' + randomUUID() + '.json');
    try {
      await old.migrator.up();
      const conn = old.em.getConnection();
      await conn.execute(
        "INSERT INTO club(id_club,nombre) VALUES(1,'Home'),(2,'Away')",
      );
      await conn.execute(
        "INSERT INTO estadio(id_estadio,nombre) VALUES(1,'Stadium')",
      );
      await conn.execute(
        "INSERT INTO evento(id_evento,fk_id_club_local,fk_id_club_visitante,fk_id_estadio_id_estadio,fecha_hora) VALUES(5,1,2,1,'2030-01-01')",
      );
      await conn.execute(
        "INSERT INTO sector(id_sector,fk_id_estadio_id_estadio,nombre_sector,capacidad) VALUES(7,1,'Sector',20)",
      );
      await conn.execute('INSERT INTO precio_evento_sector VALUES(7,7,10.00)');
      await conn.execute(
        "INSERT INTO usuario(id_usuario,dni,nombre,apellido,email,password) VALUES(1,'12345678','Legacy','User','legacy@example.test','unused')",
      );
      await conn.execute(
        "INSERT INTO compra(id_compra,fk_usuario_id_usuario,monto_total,estado_pago) VALUES(1,1,10.00,'Pendiente'),(2,1,10.00,'completada')",
      );
      await conn.execute(
        "INSERT INTO entrada(id_entrada,fk_id_sector_id_sector,fk_id_evento_id_evento,fk_id_compra_id_compra,codigo_qr) VALUES(1,7,5,2,'legacy-qr-preserved')",
      );
    } finally {
      await old.close(true);
    }
    const updated = await MikroORM.init({
      ...config,
      host: root.config.host,
      port: root.config.port,
      user: root.config.user,
      password: root.config.password,
      dbName: legacyName,
      migrations: {
        ...config.migrations,
        migrationsList: [Initial, Correction],
      },
    });
    try {
      await expect(updated.migrator.up()).rejects.toThrow('ambiguos');
      writeFileSync(file, JSON.stringify({ '7:7': 5 }));
      process.env.PRICE_EVENT_MAP_FILE = file;
      await updated.migrator.up();
      const rows = await updated.em
        .getConnection()
        .execute('SELECT * FROM precio_evento_sector');
      expect(rows).toHaveLength(1);
      expect(rows[0].fk_id_evento_id_evento).toBe(5);
      expect(String(rows[0].precio)).toBe('10.00');
      expect(await updated.em.fork().count(Usuario, {})).toBe(1);
      expect(await updated.em.fork().count(Compra, {})).toBe(2);
      expect(
        (await updated.em.fork().findOneOrFail(Compra, { idCompra: 1 }))
          .estadoPago,
      ).toBe('revision');
      const ticket = await updated.em
        .fork()
        .findOneOrFail(Entrada, { idEntrada: 1 });
      expect(ticket.codigoQr).toBe('legacy-qr-preserved');
      expect(ticket.snapshot.nombreLocal).toBe('Home');
      await updated.em
        .fork()
        .nativeUpdate(Club, { idClub: 1 }, { nombre: 'Renamed' });
      expect(
        (
          await updated.em
            .fork()
            .findOneOrFail(Entrada, { idEntrada: 1 }, { refresh: true })
        ).snapshot.nombreLocal,
      ).toBe('Home');
      const audit = JSON.parse(
        execFileSync(process.execPath, ['dist/scripts/audit.js'], {
          encoding: 'utf8',
          env: {
            ...process.env,
            DB_HOST: root.config.host,
            DB_PORT: String(root.config.port),
            DB_USER: root.config.user,
            DB_PASSWORD: root.config.password,
            DB_NAME: legacyName,
          },
        }),
      );
      expect(audit.invalidTicketRelations).toEqual([]);
      expect(audit.purchasesWithoutUser).toEqual([]);
      expect(audit.entrada[0].total).toBe(1);
    } finally {
      delete process.env.PRICE_EVENT_MAP_FILE;
      try {
        unlinkSync(file);
      } catch {}
      await updated.close(true);
      await root.query('DROP DATABASE ' + legacyName);
    }
  });
});

describe('sale invariants and administration', () => {
  it('matches per-sector occupancy without adding queries for more sectors', async () => {
    const sold = await checkout();
    await processPayment(orm.em.fork(), approved(sold));
    await checkout();
    const em = orm.em.fork();
    const connection = em.getConnection();
    const execute = vi.spyOn(connection, 'execute');
    try {
      const first = await request(app)
        .get('/api/eventos/' + fixture.event + '/sectores')
        .expect(200);
      const queries = execute.mock.calls.length;
      expect(first.body.data[0].disponibles).toBe(
        2 - (await occupied(em, fixture.event, fixture.sector)),
      );
      const original = await em.findOneOrFail(Sector, fixture.sector);
      for (let i = 0; i < 4; i++) {
        const sector = em.create(Sector, {
          fkIdEstadio: original.fkIdEstadio,
          nombreSector: 'Sector ' + i,
          capacidad: 10,
        });
        await em.persistAndFlush(sector);
        await em.persistAndFlush(
          em.create(PrecioEventoSector, {
            fkIdEvento: fixture.event,
            fkIdSector: sector,
            precio: '10.00',
          }),
        );
        await em.persistAndFlush(
          em.create(Compra, {
            fkUsuario: fixture.user,
            eventoId: fixture.event,
            sectorId: sector.idSector,
            quantity: i + 1,
            montoTotal: '10.00',
            estadoPago: 'rechazada',
            expiresAt: new Date(Date.now() + 600000),
          }),
        );
        await em.persistAndFlush(
          em.create(Compra, {
            fkUsuario: fixture.user,
            eventoId: fixture.event,
            sectorId: sector.idSector,
            quantity: 9,
            montoTotal: '10.00',
            estadoPago: 'pendiente',
            expiresAt: new Date(0),
          }),
        );
      }
      execute.mockClear();
      const response = await request(app)
        .get('/api/eventos/' + fixture.event + '/sectores')
        .expect(200);
      expect(execute.mock.calls.length).toBe(queries);
      for (const row of response.body.data) {
        expect(row).toEqual({
          idSector: row.idSector,
          nombreSector:
            row.idSector === fixture.sector
              ? 'Popular'
              : 'Sector ' + (row.idSector - fixture.sector - 1),
          capacidad: row.idSector === fixture.sector ? 2 : 10,
          precio: '10.00',
          disponibles: Math.max(
            0,
            row.capacidad - (await occupied(em, fixture.event, row.idSector)),
          ),
        });
      }
    } finally {
      execute.mockRestore();
    }
  });
  async function admin() {
    await orm.em
      .fork()
      .nativeUpdate(Usuario, { idUsuario: fixture.user }, { rol: 'admin' });
    const token = require('jsonwebtoken').sign(
      { idUsuario: fixture.user, sessionVersion: 0 },
      getEnv().JWT_SECRET,
      { expiresIn: '1h' },
    );
    return token;
  }
  it('normalizes edited emails and invalidates sessions only when the email changes', async () => {
    const token = await admin();
    await request(app)
      .put('/api/users/' + fixture.user)
      .auth(token, { type: 'bearer' })
      .send({ email: 'TEST@EXAMPLE.TEST' })
      .expect(200);
    expect(
      (await orm.em.fork().findOneOrFail(Usuario, fixture.user)).sessionVersion,
    ).toBe(0);
    const updated = await request(app)
      .put('/api/users/' + fixture.user)
      .auth(token, { type: 'bearer' })
      .send({ email: 'NEW@EXAMPLE.TEST' })
      .expect(200);
    expect(updated.body.email).toBe('new@example.test');
    expect(
      (await orm.em.fork().findOneOrFail(Usuario, fixture.user)).sessionVersion,
    ).toBe(1);
    await request(app)
      .get('/api/users/me')
      .auth(token, { type: 'bearer' })
      .expect(401);
  });
  it('rejects admin self deletion and preserves users with purchases', async () => {
    const token = await admin();
    const self = await request(app)
      .delete('/api/users/' + fixture.user)
      .auth(token, { type: 'bearer' })
      .expect(400);
    expect(self.body.code).toBe('CANNOT_DELETE_SELF');
    const em = orm.em.fork();
    const buyer = em.create(Usuario, {
      dni: '23456789',
      nombre: 'Buyer',
      apellido: 'Test',
      email: 'buyer@example.test',
      password: 'unused',
    });
    await em.persistAndFlush(buyer);
    await em.persistAndFlush(
      em.create(Compra, {
        fkUsuario: buyer,
        montoTotal: '10.00',
        estadoPago: 'pendiente',
      }),
    );
    const conflict = await request(app)
      .delete('/api/users/' + buyer.idUsuario)
      .auth(token, { type: 'bearer' })
      .expect(409);
    expect(conflict.body.code).toBe('CONFLICT');
    expect(await em.count(Usuario, { idUsuario: buyer.idUsuario })).toBe(1);
    expect(await em.count(Compra, { fkUsuario: buyer.idUsuario })).toBe(1);
  });
  it('rejects closed/past events, undefined capacity and a sector in another stadium', async () => {
    const em = orm.em.fork();
    await em.nativeUpdate(
      Evento,
      { idEvento: fixture.event },
      { estado: 'Cancelado' },
    );
    await expect(checkout()).rejects.toMatchObject({ code: 'NOT_ON_SALE' });
    await em.nativeUpdate(
      Evento,
      { idEvento: fixture.event },
      { estado: 'En Venta', fechaHora: new Date(0) },
    );
    await expect(checkout()).rejects.toMatchObject({ code: 'NOT_ON_SALE' });
    await em.nativeUpdate(
      Evento,
      { idEvento: fixture.event },
      { fechaHora: new Date(Date.now() + 86400000) },
    );
    await em.nativeUpdate(
      Sector,
      { idSector: fixture.sector },
      { capacidad: null },
    );
    await expect(checkout()).rejects.toMatchObject({ code: 'SOLD_OUT' });
    const s = em.create(Estadio, { nombre: 'Other' });
    await em.persistAndFlush(s);
    await em.nativeUpdate(
      Sector,
      { idSector: fixture.sector },
      { fkIdEstadio: s.idEstadio, capacidad: 2 },
    );
    await expect(checkout()).rejects.toMatchObject({ code: 'INVALID_SECTOR' });
    expect(await orm.em.fork().count(Compra, {})).toBe(0);
  });
  it('persists provider rejection then accepts a verified approval within the reservation', async () => {
    const c = await checkout();
    await processPayment(orm.em.fork(), { ...approved(c), status: 'rejected' });
    expect(
      (await orm.em.fork().findOneOrFail(Compra, { idCompra: c.idCompra }))
        .estadoPago,
    ).toBe('rechazada');
    await processPayment(orm.em.fork(), approved(c));
    expect(await orm.em.fork().count(Entrada, {})).toBe(1);
  });
  it('reconciles an approval after a worker restart using stored purchase detail', async () => {
    const c = await checkout();
    await reconcile(orm.em.fork(), {
      ...gateway,
      async searchPayments(id) {
        return id === c.idCompra ? [approved(c)] : [];
      },
    });
    expect(await orm.em.fork().count(Entrada, {})).toBe(1);
    await reconcile(orm.em.fork(), {
      ...gateway,
      async searchPayments(id) {
        return id === c.idCompra ? [approved(c)] : [];
      },
    });
    expect(await orm.em.fork().count(Entrada, {})).toBe(1);
  });
  it('protects occupied capacity, price deletion and event relationships', async () => {
    const token = await admin(),
      c = await checkout(2),
      auth = { Authorization: 'Bearer ' + token };
    await request(app)
      .put('/api/sectores/' + fixture.sector)
      .set(auth)
      .send({ capacidad: 1 })
      .expect(409);
    await request(app)
      .delete('/api/precios/' + fixture.event + '/' + fixture.sector)
      .set(auth)
      .expect(409);
    await request(app)
      .delete('/api/eventos/' + fixture.event)
      .set(auth)
      .expect(409);
    await request(app)
      .delete('/api/sectores/' + fixture.sector)
      .set(auth)
      .expect(409);
    const other = await request(app)
      .post('/api/clubes')
      .set(auth)
      .send({ nombre: 'Otro club' })
      .expect(201);
    await request(app)
      .put('/api/eventos/' + fixture.event)
      .set(auth)
      .send({ fkIdClubLocal: other.body.idClub })
      .expect(409);
    await request(app)
      .put('/api/eventos/' + fixture.event)
      .set(auth)
      .send({ estado: 'Cancelado' })
      .expect(200);
    expect(
      (await orm.em.fork().findOneOrFail(Compra, { idCompra: c.idCompra }))
        .estadoPago,
    ).toBe('cancelada');
    await processPayment(orm.em.fork(), approved(c));
    expect(await orm.em.fork().count(Entrada, {})).toBe(0);
    expect(
      (await orm.em.fork().findOneOrFail(Compra, { idCompra: c.idCompra }))
        .estadoPago,
    ).toBe('reembolsoPendiente');
  });
  it('keeps ticket commercial snapshots after names and prices change', async () => {
    const token = await admin(),
      c = await checkout();
    const event = await orm.em
      .fork()
      .findOneOrFail(Evento, { idEvento: fixture.event });
    await request(app)
      .put('/api/clubes/' + event.fkIdClubLocal.idClub)
      .auth(token, { type: 'bearer' })
      .send({ nombre: 'Changed name' })
      .expect(200);
    await request(app)
      .post('/api/precios')
      .auth(token, { type: 'bearer' })
      .send({
        fkIdEvento: fixture.event,
        fkIdSector: fixture.sector,
        precio: '20.00',
      })
      .expect(201);
    await processPayment(orm.em.fork(), approved(c));
    const tickets = await request(app)
      .get('/api/pagos/entradas/' + c.idCompra)
      .auth(token, { type: 'bearer' })
      .expect(200);
    expect(tickets.body[0].nombreLocal).toBe('Local');
    expect(c.montoTotal).toBe('10.00');
  });
  it('supports CRUD and sanitized DTOs on unreferenced resources', async () => {
    const token = await admin(),
      auth = { Authorization: 'Bearer ' + token };
    const club = await request(app)
      .post('/api/clubes')
      .set(auth)
      .send({ nombre: 'New club', logoUrl: '' })
      .expect(201);
    const updated = await request(app)
      .put('/api/clubes/' + club.body.idClub)
      .set(auth)
      .send({ nombre: 'Updated club' })
      .expect(200);
    expect(updated.body.nombre).toBe('Updated club');
    await request(app)
      .delete('/api/clubes/' + club.body.idClub)
      .set(auth)
      .expect(204);
    const stadium = await request(app)
      .post('/api/estadios')
      .set(auth)
      .send({ nombre: 'New stadium' })
      .expect(201);
    const sector = await request(app)
      .post('/api/sectores')
      .set(auth)
      .send({
        fkIdEstadio: stadium.body.idEstadio,
        nombreSector: 'Sector new',
        capacidad: 5,
      })
      .expect(201);
    const list = await request(app)
      .get('/api/sectores?fkIdEstadio=' + stadium.body.idEstadio)
      .expect(200);
    expect(list.body.data.map((s) => s.idSector)).toEqual([
      sector.body.idSector,
    ]);
    expect(typeof list.body.data[0].fkIdEstadio).toBe('number');
    await request(app)
      .put('/api/sectores/' + sector.body.idSector)
      .set(auth)
      .send({ capacidad: 10 })
      .expect(200);
    await request(app)
      .delete('/api/sectores/' + sector.body.idSector)
      .set(auth)
      .expect(204);
    const edit = await request(app)
      .put('/api/estadios/' + stadium.body.idEstadio)
      .set(auth)
      .send({ ciudad: 'Rosario' })
      .expect(200);
    expect(edit.body.ciudad).toBe('Rosario');
    await request(app)
      .delete('/api/estadios/' + stadium.body.idEstadio)
      .set(auth)
      .expect(204);
    const bad = await request(app).get('/api/eventos/invalid').expect(400);
    expect(bad.body.code).toBe('VALIDATION_ERROR');
  });
  it('validates webhook signature without calling the provider', async () => {
    const r = await request(app)
      .post('/api/pagos/webhook?data.id=123')
      .send({ type: 'payment', data: { id: '123' } })
      .expect(401);
    expect(r.body.code).toBe('INVALID_SIGNATURE');
    expect(await orm.em.fork().count(Entrada, {})).toBe(0);
  });
});
