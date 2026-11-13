import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { withTransaction } from '../db.js';
import { HttpError, wrap } from '../middleware/errors.js';
import { clearSession, requireAuth, setSession } from '../middleware/auth.js';

const credentials = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(200),
});

// Compared against when the email is unknown, so timing does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

export function authRoutes(pool) {
  const r = Router();

  r.post('/signup', limiter, wrap(async (req, res) => {
    const { email, password } = credentials.parse(req.body);
    const hash = await bcrypt.hash(password, 12);
    let user;
    try {
      user = await withTransaction(pool, async (c) => {
        const u = (await c.query('INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, name, onboarded', [email, hash])).rows[0];
        await c.query('INSERT INTO profiles (user_id) VALUES ($1)', [u.id]);
        return u;
      });
    } catch (e) {
      if (e.code === '23505') throw new HttpError(409, 'An account with this email already exists. Try logging in.');
      throw e;
    }
    setSession(res, user.id);
    res.status(201).json({ user });
  }));

  r.post('/login', limiter, wrap(async (req, res) => {
    const { email, password } = credentials.parse(req.body);
    const u = (await pool.query('SELECT id, email, name, onboarded, password_hash FROM users WHERE lower(email) = $1', [email])).rows[0];
    const ok = await bcrypt.compare(password, u ? u.password_hash : DUMMY_HASH);
    if (!u || !ok) throw new HttpError(401, 'Incorrect email or password.');
    setSession(res, u.id);
    res.json({ user: { id: u.id, email: u.email, name: u.name, onboarded: u.onboarded } });
  }));

  r.post('/logout', (req, res) => {
    clearSession(res);
    res.json({ ok: true });
  });

  r.get('/me', requireAuth, wrap(async (req, res) => {
    const u = (await pool.query('SELECT id, email, name, onboarded FROM users WHERE id = $1', [req.userId])).rows[0];
    if (!u) {
      clearSession(res);
      throw new HttpError(401, 'Please log in.');
    }
    res.json({ user: u });
  }));

  return r;
}
