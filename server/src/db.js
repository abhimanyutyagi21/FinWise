import pg from 'pg';

// numeric -> number, date -> 'YYYY-MM-DD' string (no timezone surprises)
pg.types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));
pg.types.setTypeParser(1082, (v) => v);

/** node-postgres does not understand Neon's channel_binding hint, so drop it from the URL. */
function cleanUrl(url) {
  try {
    const u = new URL(url);
    u.searchParams.delete('channel_binding');
    return u.toString();
  } catch (e) {
    return url;
  }
}

/**
 * Pool tuned for Neon (works for any Postgres): small client-side pool because Neon's pooler
 * already multiplexes connections, short idle timeout, and a generous connect timeout so the
 * first request after the database wakes from idle does not fail.
 */
export function createPool({ databaseUrl, databaseSsl, poolMax = 5 }) {
  const pool = new pg.Pool({
    connectionString: cleanUrl(databaseUrl),
    ssl: databaseSsl ? true : undefined, // a sslmode in the URL still takes precedence
    max: poolMax,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 15000,
  });
  // An idle client dropped by the server must not crash the process.
  pool.on('error', (err) => console.error('Idle database client error:', err.message));
  return pool;
}

/** Runs fn(client) inside BEGIN/COMMIT, rolling back on error. */
export async function withTransaction(pool, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
