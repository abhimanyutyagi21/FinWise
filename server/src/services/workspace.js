import { withTransaction } from '../db.js';
import { processRecurring } from './recurring.js';

export const mapTx = (r) => ({
  id: r.id, type: r.type, description: r.description, category: r.category, amount: r.amount,
  date: r.date, recurring: r.recurring, generatedFrom: r.generated_from,
});

/** The whole workspace in the exact shape the React app keeps in state. */
export async function getWorkspace(pool, userId) {
  await withTransaction(pool, (c) => processRecurring(c, userId));
  const q = (sql) => pool.query(sql, [userId]).then((r) => r.rows);
  const [users, profiles, goals, txs, budgets, subs, scenarios] = await Promise.all([
    q('SELECT name, currency, onboarded FROM users WHERE id = $1'),
    q('SELECT income, essentials, commitments, savings FROM profiles WHERE user_id = $1'),
    q('SELECT id, name, target, saved, icon FROM goals WHERE user_id = $1 ORDER BY created_at, id'),
    q('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date, created_at'),
    q('SELECT category, limit_amount FROM budgets WHERE user_id = $1 ORDER BY category'),
    q('SELECT id, name, category, amount, cycle FROM subscriptions WHERE user_id = $1 ORDER BY created_at, id'),
    q('SELECT id, name, monthly, one_time, duration, note, created_at FROM scenarios WHERE user_id = $1 ORDER BY created_at, id'),
  ]);
  const u = users[0];
  if (!u) return null;
  const p = profiles[0] || { income: 0, essentials: 0, commitments: 0, savings: 0 };
  return {
    profile: { name: u.name, ...p },
    currency: u.currency.trim(),
    onboarded: u.onboarded,
    goals,
    transactions: txs.map(mapTx),
    budgets: budgets.map((b) => ({ category: b.category, limit: b.limit_amount })),
    subscriptions: subs,
    scenarios: scenarios.map((s) => ({
      id: s.id, name: s.name, monthly: s.monthly, oneTime: s.one_time, duration: s.duration, note: s.note, createdAt: s.created_at,
    })),
  };
}
