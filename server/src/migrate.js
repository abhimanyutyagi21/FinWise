import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createPool, withTransaction } from './db.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const LOCK_ID = 727274; // arbitrary app-wide number

/**
 * Applies every migrations/*.sql file that has not run yet, in filename order.
 * Safe to run from several instances at once: each migration takes a transaction-level
 * advisory lock and re-checks before running.
 */
export async function migrate(pool, log = console.log) {
  // Under the lock too: concurrent CREATE TABLE IF NOT EXISTS can race and fail.
  await withTransaction(pool, async (c) => {
    await c.query('SELECT pg_advisory_xact_lock($1)', [LOCK_ID]);
    await c.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  });
  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    const sql = await readFile(path.join(dir, f), 'utf8');
    await withTransaction(pool, async (c) => {
      await c.query('SELECT pg_advisory_xact_lock($1)', [LOCK_ID]);
      const done = await c.query('SELECT 1 FROM schema_migrations WHERE name = $1', [f]);
      if (done.rowCount) return;
      await c.query(sql);
      await c.query('INSERT INTO schema_migrations (name) VALUES ($1)', [f]);
      log('applied', f);
    });
  }
}

/** Runs migrations over the direct (non-pooled) connection, then closes it. */
export async function migrateWithConfig(config, log) {
  const pool = createPool({ ...config, databaseUrl: config.migrationUrl, poolMax: 1 });
  try {
    await migrate(pool, log);
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { config } = await import('./config.js');
  migrateWithConfig(config)
    .then(() => console.log('migrations up to date'))
    .catch((e) => { console.error(e); process.exit(1); });
}
