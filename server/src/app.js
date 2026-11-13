import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { originCheck } from './middleware/auth.js';
import { authRoutes } from './routes/auth.js';
import { workspaceRoutes } from './routes/workspace.js';
import { aiRoutes } from './routes/ai.js';

/** staticDir: optional folder with the built React app (served with SPA fallback). */
export function createApp(pool, { staticDir } = {}) {
  const app = express();
  if (config.isProd) app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", 'https://fonts.googleapis.com'],
        'style-src-attr': ["'unsafe-inline'"],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'https://images.unsplash.com'],
        'connect-src': ["'self'", 'https://open.er-api.com'],
        'frame-ancestors': ["'none'"],
      },
    },
  }));
  app.use(cors({ origin: config.clientOrigins, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  // Cheap liveness probe for the hosting platform (does not touch the database,
  // so health checks never wake a paused Neon database).
  app.get('/api/live', (req, res) => res.json({ ok: true }));

  app.get('/api/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ ok: true });
    } catch (e) {
      res.status(503).json({ ok: false });
    }
  });

  app.use('/api', originCheck);
  app.use('/api/auth', authRoutes(pool));
  app.use('/api/ai', aiRoutes());
  app.use('/api', workspaceRoutes(pool));
  app.use('/api', notFound);

  if (staticDir && fs.existsSync(path.join(staticDir, 'index.html'))) {
    app.use(express.static(staticDir, { index: false, maxAge: '1h' }));
    app.get('*', (req, res) => res.sendFile(path.join(staticDir, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
