import 'dotenv/config';
import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'node:fs';
async function main() {
  for (const key of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'])
    if (!process.env[key]) throw new Error('Falta ' + key);
  const db = await createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    await db.query('SET TRANSACTION READ ONLY');
    await db.beginTransaction();
    const report: Record<string, unknown> = {};
    for (const table of [
      'club',
      'estadio',
      'sector',
      'evento',
      'usuario',
      'compra',
      'entrada',
      'precio_evento_sector',
    ]) {
      const [count] = await db.query('SELECT COUNT(*) AS total FROM ' + table);
      report[table] = count;
    }
    const [schema] = await db.query(
      'SELECT TABLE_NAME,COLUMN_NAME,COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME,ORDINAL_POSITION',
    );
    report.schema = schema;
    const [history] = await db.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='mikro_orm_migrations'",
    );
    if ((history as unknown[]).length) {
      const [rows] = await db.query('SELECT * FROM mikro_orm_migrations');
      report.migrations = rows;
    }
    const [pending] = await db.query(
      "SELECT id_compra,estado_pago,id_preferencia_mp,id_pago_mp FROM compra WHERE LOWER(estado_pago) IN ('pendiente','revision')",
    );
    report.pending = pending;
    const [prices] = await db.query('SELECT * FROM precio_evento_sector');
    report.pricesRequiringExplicitReview = prices;
    const [foreignKeys] = await db.query(
      'SELECT TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL',
    );
    report.foreignKeys = foreignKeys;
    const [invalidTickets] = await db.query(`SELECT t.id_entrada FROM entrada t
      LEFT JOIN evento e ON e.id_evento=t.fk_id_evento_id_evento
      LEFT JOIN sector s ON s.id_sector=t.fk_id_sector_id_sector
      LEFT JOIN compra c ON c.id_compra=t.fk_id_compra_id_compra
      WHERE e.id_evento IS NULL OR s.id_sector IS NULL
        OR e.fk_id_estadio_id_estadio<>s.fk_id_estadio_id_estadio
        OR (t.fk_id_compra_id_compra IS NOT NULL AND c.id_compra IS NULL)`);
    report.invalidTicketRelations = invalidTickets;
    const [invalidUsers] = await db.query(
      'SELECT c.id_compra FROM compra c LEFT JOIN usuario u ON u.id_usuario=c.fk_usuario_id_usuario WHERE u.id_usuario IS NULL',
    );
    report.purchasesWithoutUser = invalidUsers;
    const [mixedPurchases] = await db.query(
      'SELECT fk_id_compra_id_compra AS idCompra,COUNT(DISTINCT fk_id_evento_id_evento,fk_id_sector_id_sector) AS combinations FROM entrada WHERE fk_id_compra_id_compra IS NOT NULL GROUP BY fk_id_compra_id_compra HAVING combinations>1',
    );
    report.purchasesWithMultipleTicketGroups = mixedPurchases;
    const [qrs] = await db.query('SELECT id_entrada,codigo_qr FROM entrada');
    report.invalidLegacyQr = (
      qrs as { id_entrada: number; codigo_qr: string }[]
    )
      .filter((r) => {
        if (!r.codigo_qr.startsWith('data:'))
          return !r.codigo_qr || r.codigo_qr === 'generating...';
        if (!/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(r.codigo_qr))
          return true;
        const b = Buffer.from(r.codigo_qr.split(',')[1], 'base64');
        return (
          b.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
          !b.subarray(-8).equals(Buffer.from('49454e44ae426082', 'hex'))
        );
      })
      .map((r) => r.id_entrada);
    report.mappingFile = process.env.PRICE_EVENT_MAP_FILE
      ? JSON.parse(readFileSync(process.env.PRICE_EVENT_MAP_FILE, 'utf8'))
      : null;
    console.log(JSON.stringify(report, null, 2));
    await db.rollback();
  } finally {
    await db.end();
  }
}
main().catch((error) => {
  console.error(
    'Auditoría fallida:',
    error instanceof Error ? error.message : 'Error',
  );
  process.exitCode = 1;
});
