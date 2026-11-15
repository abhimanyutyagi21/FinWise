import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { createPool } from './db.js';
import { migrateWithConfig } from './migrate.js';
import { createApp } from './app.js';
import { aiProviderNames } from './services/ai/index.js';

await migrateWithConfig(config); // keeps the schema current on every start (direct connection)
const pool = createPool(config);

const staticDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist');
const server = createApp(pool, { staticDir: config.isProd ? staticDir : undefined }).listen(config.port, () => {
  console.log(`FinWise API listening on http://localhost:${config.port}`);
  const ai = aiProviderNames();
  console.log(ai.length ? `AI analysis providers (in order): ${ai.join(', ')}` : 'No AI key set (GROQ_API_KEY / GEMINI_API_KEY): AI analysis will show as "Not connected".');
});

const shutdown = () => server.close(() => pool.end().then(() => process.exit(0)));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
