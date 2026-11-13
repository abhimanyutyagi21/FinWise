import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { wrap } from '../middleware/errors.js';
import { aiEnabled, analyzeWithGemini } from '../services/gemini.js';

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 8,
  keyGenerator: (req) => req.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests. Please wait a minute.' },
});

const body = z.object({ question: z.string().max(300).optional() }).passthrough();

export function aiRoutes() {
  const r = Router();
  r.use(requireAuth);
  r.get('/health', (req, res) => (aiEnabled() ? res.json({ ok: true }) : res.status(503).json({ ok: false })));
  r.post('/analyze', limiter, wrap(async (req, res) => {
    res.json(await analyzeWithGemini(body.parse(req.body)));
  }));
  return r;
}
