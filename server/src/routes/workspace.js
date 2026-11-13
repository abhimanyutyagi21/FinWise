import { Router } from 'express';
import { z } from 'zod';
import { withTransaction } from '../db.js';
import { HttpError, wrap } from '../middleware/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { getWorkspace, mapTx } from '../services/workspace.js';
import { processRecurring } from '../services/recurring.js';

const MAX = 1e9;
const money = z.number().finite().min(0).max(MAX);
const positive = z.number().finite().positive().max(MAX);
const text = (n) => z.string().trim().max(n);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD.').refine((s) => !Number.isNaN(Date.parse(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s, 'Not a real date.');
const id = z.string().uuid();
const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'SGD', 'AED', 'CHF'];

const schemas = {
  profile: z.object({
    name: text(40).min(1, 'Please enter a name.').optional(),
    income: money.optional(), essentials: money.optional(), commitments: money.optional(), savings: money.optional(),
  }),
  onboarding: z.object({
    name: text(40).min(1, 'Please enter your name.'),
    income: positive, essentials: money, commitments: money, savings: money, saved: money,
    goalName: text(40).min(1, 'Give your goal a name.'), goalTarget: positive,
  }),
  transaction: z.object({
    type: z.enum(['income', 'expense']), description: text(90), category: text(60).min(1), amount: positive, date: isoDate, recurring: z.boolean().optional(),
  }),
  budget: z.object({ limit: positive }),
  subscription: z.object({ name: text(80).min(1), category: text(60).min(1), amount: positive, cycle: z.enum(['monthly', 'yearly', 'weekly']) }),
  goal: z.object({ name: text(60).min(1, 'Please give your goal a name.'), target: positive }),
  goalPatch: z.union([z.object({ saved: money }).strict(), z.object({ add: positive }).strict()]),
  scenario: z.object({ name: text(70).min(1), monthly: money, oneTime: money, duration: z.number().int().min(1).max(600), note: text(120).optional() }),
  convert: z.object({ to: z.enum(CURRENCIES), factor: z.number().finite().min(1e-6).max(1e6) }),
};

export function workspaceRoutes(pool) {
  const r = Router();
  r.use(requireAuth);

  r.get('/workspace', wrap(async (req, res) => {
    const ws = await getWorkspace(pool, req.userId);
    if (!ws) throw new HttpError(401, 'Please log in.');
    res.json(ws);
  }));

  // Wipes everything and returns to a brand-new account state (keeps the login).
  r.delete('/workspace', wrap(async (req, res) => {
    await withTransaction(pool, async (c) => {
      for (const t of ['goals', 'transactions', 'budgets', 'subscriptions', 'scenarios']) await c.query(`DELETE FROM ${t} WHERE user_id = $1`, [req.userId]);
      await c.query('UPDATE profiles SET income = 0, essentials = 0, commitments = 0, savings = 0 WHERE user_id = $1', [req.userId]);
      await c.query("UPDATE users SET name = '', currency = 'USD', onboarded = false WHERE id = $1", [req.userId]);
    });
    res.json({ ok: true });
  }));

  r.put('/profile', wrap(async (req, res) => {
    const b = schemas.profile.parse(req.body);
    await withTransaction(pool, async (c) => {
      if (b.name !== undefined) await c.query('UPDATE users SET name = $2 WHERE id = $1', [req.userId, b.name]);
      await c.query(
        `INSERT INTO profiles (user_id, income, essentials, commitments, savings)
         VALUES ($1, COALESCE($2,0), COALESCE($3,0), COALESCE($4,0), COALESCE($5,0))
         ON CONFLICT (user_id) DO UPDATE SET
           income = COALESCE($2, profiles.income), essentials = COALESCE($3, profiles.essentials),
           commitments = COALESCE($4, profiles.commitments), savings = COALESCE($5, profiles.savings)`,
        [req.userId, b.income ?? null, b.essentials ?? null, b.commitments ?? null, b.savings ?? null],
      );
    });
    res.json({ ok: true });
  }));

  r.post('/onboarding', wrap(async (req, res) => {
    const b = schemas.onboarding.parse(req.body);
    await withTransaction(pool, async (c) => {
      await c.query('UPDATE users SET name = $2, onboarded = true WHERE id = $1', [req.userId, b.name]);
      await c.query(
        `INSERT INTO profiles (user_id, income, essentials, commitments, savings) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (user_id) DO UPDATE SET income=$2, essentials=$3, commitments=$4, savings=$5`,
        [req.userId, b.income, b.essentials, b.commitments, b.savings],
      );
      const ex = (await c.query('SELECT id FROM goals WHERE user_id = $1 AND lower(name) = lower($2) LIMIT 1', [req.userId, b.goalName])).rows[0];
      if (ex) await c.query('UPDATE goals SET saved = $2, target = $3 WHERE id = $1', [ex.id, b.saved, b.goalTarget]);
      else await c.query("INSERT INTO goals (user_id, name, target, saved, icon) VALUES ($1,$2,$3,$4,'◉')", [req.userId, b.goalName, b.goalTarget, b.saved]);
    });
    res.json({ ok: true });
  }));

  /* ---- transactions ---- */
  r.post('/transactions', wrap(async (req, res) => {
    const b = schemas.transaction.parse(req.body);
    const rows = await withTransaction(pool, async (c) => {
      const row = (await c.query(
        `INSERT INTO transactions (user_id, type, description, category, amount, date, recurring, last_processed)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [req.userId, b.type, b.description, b.category, b.amount, b.date, !!b.recurring, b.recurring ? b.date : null],
      )).rows[0];
      await processRecurring(c, req.userId); // back-dated recurring entries catch up immediately
      return (await c.query('SELECT * FROM transactions WHERE user_id = $1 AND (id = $2 OR generated_from = $2) ORDER BY date', [req.userId, row.id])).rows;
    });
    res.status(201).json({ transactions: rows.map(mapTx) });
  }));

  r.delete('/transactions/:id', wrap(async (req, res) => {
    const tid = id.parse(req.params.id);
    const r2 = await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [tid, req.userId]);
    if (!r2.rowCount) throw new HttpError(404, 'Transaction not found.');
    res.json({ ok: true });
  }));

  /* ---- budgets (one per category) ---- */
  r.put('/budgets/:category', wrap(async (req, res) => {
    const category = text(60).min(1).parse(req.params.category);
    const { limit } = schemas.budget.parse(req.body);
    await pool.query(
      `INSERT INTO budgets (user_id, category, limit_amount) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, category) DO UPDATE SET limit_amount = $3`,
      [req.userId, category, limit],
    );
    res.json({ category, limit });
  }));

  r.delete('/budgets/:category', wrap(async (req, res) => {
    const r2 = await pool.query('DELETE FROM budgets WHERE user_id = $1 AND category = $2', [req.userId, req.params.category]);
    if (!r2.rowCount) throw new HttpError(404, 'Budget not found.');
    res.json({ ok: true });
  }));

  /* ---- subscriptions ---- */
  r.post('/subscriptions', wrap(async (req, res) => {
    const b = schemas.subscription.parse(req.body);
    const row = (await pool.query(
      'INSERT INTO subscriptions (user_id, name, category, amount, cycle) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, category, amount, cycle',
      [req.userId, b.name, b.category, b.amount, b.cycle],
    )).rows[0];
    res.status(201).json(row);
  }));

  r.delete('/subscriptions/:id', wrap(async (req, res) => {
    const r2 = await pool.query('DELETE FROM subscriptions WHERE id = $1 AND user_id = $2', [id.parse(req.params.id), req.userId]);
    if (!r2.rowCount) throw new HttpError(404, 'Recurring cost not found.');
    res.json({ ok: true });
  }));

  /* ---- goals ---- */
  r.post('/goals', wrap(async (req, res) => {
    const b = schemas.goal.parse(req.body);
    const row = (await pool.query(
      "INSERT INTO goals (user_id, name, target, saved, icon) VALUES ($1,$2,$3,0,'◎') RETURNING id, name, target, saved, icon",
      [req.userId, b.name, b.target],
    )).rows[0];
    res.status(201).json(row);
  }));

  r.patch('/goals/:id', wrap(async (req, res) => {
    const gid = id.parse(req.params.id);
    const b = schemas.goalPatch.parse(req.body);
    const sql = 'saved' in b
      ? 'UPDATE goals SET saved = LEAST(target * 10, $3) WHERE id = $1 AND user_id = $2 RETURNING id, name, target, saved, icon'
      : 'UPDATE goals SET saved = LEAST(target * 10, saved + $3) WHERE id = $1 AND user_id = $2 RETURNING id, name, target, saved, icon';
    const row = (await pool.query(sql, [gid, req.userId, 'saved' in b ? b.saved : b.add])).rows[0];
    if (!row) throw new HttpError(404, 'Goal not found.');
    res.json(row);
  }));

  r.delete('/goals/:id', wrap(async (req, res) => {
    const r2 = await pool.query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [id.parse(req.params.id), req.userId]);
    if (!r2.rowCount) throw new HttpError(404, 'Goal not found.');
    res.json({ ok: true });
  }));

  /* ---- scenarios ---- */
  r.post('/scenarios', wrap(async (req, res) => {
    const b = schemas.scenario.parse(req.body);
    const s = (await pool.query(
      `INSERT INTO scenarios (user_id, name, monthly, one_time, duration, note) VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, name, monthly, one_time, duration, note, created_at`,
      [req.userId, b.name, b.monthly, b.oneTime, b.duration, b.note || ''],
    )).rows[0];
    res.status(201).json({ id: s.id, name: s.name, monthly: s.monthly, oneTime: s.one_time, duration: s.duration, note: s.note, createdAt: s.created_at });
  }));

  /* ---- currency: convert every stored amount in one atomic step ---- */
  r.post('/currency/convert', wrap(async (req, res) => {
    const { to, factor } = schemas.convert.parse(req.body);
    const conv = (col) => `${col} = CASE WHEN ${col} > 0 THEN GREATEST(0.01, ROUND(${col} * $2::numeric, 2)) ELSE ${col} END`;
    await withTransaction(pool, async (c) => {
      const p = [req.userId, factor];
      await c.query(`UPDATE profiles SET ${conv('income')}, ${conv('essentials')}, ${conv('commitments')}, ${conv('savings')} WHERE user_id = $1`, p);
      await c.query(`UPDATE goals SET ${conv('target')}, ${conv('saved')} WHERE user_id = $1`, p);
      await c.query(`UPDATE transactions SET ${conv('amount')} WHERE user_id = $1`, p);
      await c.query(`UPDATE budgets SET ${conv('limit_amount')} WHERE user_id = $1`, p);
      await c.query(`UPDATE subscriptions SET ${conv('amount')} WHERE user_id = $1`, p);
      await c.query(`UPDATE scenarios SET ${conv('monthly')}, ${conv('one_time')} WHERE user_id = $1`, p);
      await c.query('UPDATE users SET currency = $2 WHERE id = $1', [req.userId, to]);
    });
    res.json({ currency: to });
  }));

  return r;
}
