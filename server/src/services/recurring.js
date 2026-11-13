/*
 * "Repeat monthly" transactions: for every month between the entry's last processed month
 * and today, create one copy (unless its date is still in the future).
 * Idempotent: the unique index on (generated_from, date) ignores repeats.
 */
const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`; // m is 0-based

export function missingDates(tx, todayIso) {
  const [ty, tm, td] = todayIso.split('-').map(Number);
  const todayMonth = ty * 12 + (tm - 1);
  const [oy, om, od] = tx.date.split('-').map(Number); // original day of month
  const [ly, lm] = (tx.lastProcessed || tx.date).split('-').map(Number);
  const out = [];
  let y = ly;
  let m = lm - 1 + 1; // month after the last processed one (0-based)
  if (m > 11) { y += 1; m -= 12; }
  let guard = 0;
  while (y * 12 + m <= todayMonth && guard++ < 120) {
    const day = Math.min(new Date(Date.UTC(y, m + 1, 0)).getUTCDate(), od);
    const d = iso(y, m, day);
    if (d > todayIso) break;
    out.push(d);
    m += 1;
    if (m > 11) { y += 1; m = 0; }
  }
  void om;
  return out;
}

/** Creates any missing monthly copies for one user. Call inside a transaction. */
export async function processRecurring(client, userId) {
  const today = new Date().toISOString().slice(0, 10);
  const { rows } = await client.query(
    `SELECT id, type, description, category, amount, date, last_processed AS "lastProcessed"
       FROM transactions WHERE user_id = $1 AND recurring = true`,
    [userId],
  );
  let created = 0;
  for (const tx of rows) {
    const dates = missingDates(tx, today);
    if (!dates.length) continue;
    for (const d of dates) {
      const r = await client.query(
        `INSERT INTO transactions (user_id, type, description, category, amount, date, recurring, generated_from)
         VALUES ($1,$2,$3,$4,$5,$6,false,$7) ON CONFLICT DO NOTHING`,
        [userId, tx.type, tx.description, tx.category, tx.amount, d, tx.id],
      );
      created += r.rowCount;
    }
    await client.query('UPDATE transactions SET last_processed = $1 WHERE id = $2', [dates[dates.length - 1], tx.id]);
  }
  return created;
}
