import { Migration } from '@mikro-orm/migrations';
import { readFileSync } from 'node:fs';
export class Migration20261111000000 extends Migration {
  override isTransactional() {
    return false;
  }
  override async up(): Promise<void> {
    const columns = (await this.execute(
      "SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='precio_evento_sector'",
    )) as { name: string }[];
    const legacy = columns.some((c) => c.name === 'fk_id_evento_id_sector');
    if (legacy) {
      const rows = (await this.execute(
        'SELECT fk_id_evento_id_sector AS oldId,fk_id_sector_id_sector AS sectorId,precio FROM precio_evento_sector',
      )) as { oldId: number; sectorId: number; precio: string }[];
      let map: Record<string, number> = {};
      if (rows.length) {
        if (!process.env.PRICE_EVENT_MAP_FILE)
          throw new Error(
            'Migración detenida: precios heredados ambiguos. Ejecutá audit y suministrá PRICE_EVENT_MAP_FILE con mapeo explícito.',
          );
        map = JSON.parse(
          readFileSync(process.env.PRICE_EVENT_MAP_FILE, 'utf8'),
        );
      }
      const seen = new Set<string>();
      for (const row of rows) {
        const target = map[row.oldId + ':' + row.sectorId];
        if (!Number.isSafeInteger(target) || target <= 0)
          throw new Error(
            'Falta mapeo válido para ' + row.oldId + ':' + row.sectorId,
          );
        const key = target + ':' + row.sectorId;
        if (seen.has(key))
          throw new Error('El mapeo produciría precios duplicados');
        seen.add(key);
        const valid = (await this.execute(
          'SELECT e.id_evento FROM evento e JOIN sector s ON s.id_sector=? AND s.fk_id_estadio_id_estadio=e.fk_id_estadio_id_estadio WHERE e.id_evento=?',
          [row.sectorId, target],
        )) as unknown[];
        if (valid.length !== 1)
          throw new Error('Mapeo con evento/sector incompatible: ' + key);
      }
      // Preflight completes before any DDL. MySQL DDL is not transactional.
      const fks = (await this.execute(
        "SELECT CONSTRAINT_NAME AS name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='precio_evento_sector' AND COLUMN_NAME='fk_id_evento_id_sector' AND REFERENCED_TABLE_NAME IS NOT NULL",
      )) as { name: string }[];
      for (const fk of fks)
        await this.execute(
          'ALTER TABLE precio_evento_sector DROP FOREIGN KEY `' +
            fk.name.replaceAll('`', '``') +
            '`',
        );
      // Stage into a new column so changing IDs cannot collide with old composite keys.
      const staged = columns.some((c) => c.name === 'corrected_event_id');
      if (!staged)
        await this.execute(
          'ALTER TABLE precio_evento_sector ADD corrected_event_id int NULL',
        );
      for (const row of rows)
        await this.execute(
          'UPDATE precio_evento_sector SET corrected_event_id=? WHERE fk_id_evento_id_sector=? AND fk_id_sector_id_sector=?',
          [map[row.oldId + ':' + row.sectorId], row.oldId, row.sectorId],
        );
      await this.execute(
        'ALTER TABLE precio_evento_sector DROP PRIMARY KEY, DROP COLUMN fk_id_evento_id_sector, CHANGE corrected_event_id fk_id_evento_id_evento int NOT NULL, ADD PRIMARY KEY (fk_id_evento_id_evento,fk_id_sector_id_sector)',
      );
    }
    const fks = (await this.execute(
      "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='precio_evento_sector' AND COLUMN_NAME='fk_id_evento_id_evento' AND REFERENCED_TABLE_NAME='evento'",
    )) as unknown[];
    if (!fks.length)
      await this.execute(
        'ALTER TABLE precio_evento_sector ADD CONSTRAINT precio_evento_correct_fk FOREIGN KEY (fk_id_evento_id_evento) REFERENCES evento(id_evento) ON UPDATE CASCADE ON DELETE CASCADE',
      );
    const add = async (table: string, name: string, definition: string) => {
      const exists = (await this.execute(
        'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?',
        [table, name],
      )) as unknown[];
      if (!exists.length)
        await this.execute(
          'ALTER TABLE ' + table + ' ADD COLUMN ' + name + ' ' + definition,
        );
    };
    await add('usuario', 'session_version', 'int NOT NULL DEFAULT 0');
    await add('usuario', 'reset_token_hash', 'varchar(64) NULL');
    await add('usuario', 'reset_expires_at', 'datetime NULL');
    await add('entrada', 'snapshot', 'json NULL');
    // Freeze existing ticket labels before future catalog edits, including legacy
    // purchases with tickets for more than one event/sector. Never regenerate QR.
    await this.execute(`UPDATE entrada t
    JOIN evento e ON e.id_evento=t.fk_id_evento_id_evento
    JOIN club l ON l.id_club=e.fk_id_club_local
    JOIN club v ON v.id_club=e.fk_id_club_visitante
    JOIN estadio st ON st.id_estadio=e.fk_id_estadio_id_estadio
    JOIN sector s ON s.id_sector=t.fk_id_sector_id_sector
    SET t.snapshot=JSON_OBJECT('nombreLocal',l.nombre,'nombreVisitante',v.nombre,
      'logoLocal',l.logo_url,'logoVisitante',v.logo_url,'nombreEstadio',st.nombre,
      'nombreSector',s.nombre_sector,'fechaHora',DATE_FORMAT(e.fecha_hora,'%Y-%m-%dT%H:%i:%s.000Z'),'torneo',e.torneo)
    WHERE t.snapshot IS NULL`);
    for (const [name, definition] of Object.entries({
      evento_id: 'int NULL',
      sector_id: 'int NULL',
      quantity: 'int NULL',
      precio_unitario: 'decimal(10,2) NULL',
      moneda: "varchar(3) NOT NULL DEFAULT 'ARS'",
      expires_at: 'datetime NULL',
      idempotency_key: 'varchar(100) NULL',
      checkout_url: 'text NULL',
      snapshot: 'json NULL',
      preference_status: "varchar(30) NOT NULL DEFAULT 'none'",
    }))
      await add('compra', name, definition);
    const index = async (table: string, name: string, sql: string) => {
      const exists = (await this.execute(
        'SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND INDEX_NAME=?',
        [table, name],
      )) as unknown[];
      if (!exists.length) await this.execute(sql);
    };
    await index(
      'compra',
      'compra_idempotency_key_unique',
      'CREATE UNIQUE INDEX compra_idempotency_key_unique ON compra(idempotency_key)',
    );
    await index(
      'compra',
      'compra_expires_at_index',
      'CREATE INDEX compra_expires_at_index ON compra(expires_at)',
    );
    await index(
      'compra',
      'compra_inventory_index',
      'CREATE INDEX compra_inventory_index ON compra(evento_id,sector_id,estado_pago,expires_at)',
    );
    await index(
      'precio_evento_sector',
      'fk_Precios_Eventos_idx',
      'CREATE INDEX fk_Precios_Eventos_idx ON precio_evento_sector(fk_id_evento_id_evento)',
    );
    await index(
      'precio_evento_sector',
      'fk_Precios_Sectores_idx',
      'CREATE INDEX fk_Precios_Sectores_idx ON precio_evento_sector(fk_id_sector_id_sector)',
    );
    await this.execute(
      "CREATE TABLE IF NOT EXISTS pago (id_pago varchar(100) NOT NULL PRIMARY KEY, compra_id_compra int NOT NULL, estado varchar(30) NOT NULL, reembolso varchar(30) NOT NULL DEFAULT 'none', created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, next_retry_at datetime NULL, attempts int NOT NULL DEFAULT 0, INDEX pago_reembolso_index(reembolso), CONSTRAINT pago_compra_fk FOREIGN KEY(compra_id_compra) REFERENCES compra(id_compra)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    );
    await this.execute(
      "UPDATE compra SET estado_pago='revision' WHERE evento_id IS NULL AND LOWER(estado_pago)='pendiente'",
    );
  }
  override async down(): Promise<void> {
    throw new Error(
      'La reversión automática eliminaría información. Restaurá el respaldo verificado.',
    );
  }
}
