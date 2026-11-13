const env = process.env;
const isProd = env.NODE_ENV === 'production';

function required(name) {
  const v = env[name];
  if (!v) throw new Error(`Missing required environment variable ${name} (see server/.env.example)`);
  return v;
}

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters long');

export const config = {
  isProd,
  port: Number(env.PORT) || 4000,
  // App traffic. On Neon use the POOLED string (host contains "-pooler").
  databaseUrl: required('DATABASE_URL'),
  // Migrations. On Neon use the DIRECT string; falls back to DATABASE_URL when not set.
  migrationUrl: env.DATABASE_URL_UNPOOLED || required('DATABASE_URL'),
  // Neon always requires TLS; turn it on automatically for *.neon.tech hosts.
  databaseSsl: env.DATABASE_SSL === 'true' || /\.neon\.tech/.test(env.DATABASE_URL || ''),
  poolMax: Number(env.DB_POOL_MAX) || 5,
  jwtSecret,
  sessionDays: 7,
  clientOrigins: (env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean),
  geminiKey: env.GEMINI_API_KEY || '',
  geminiModel: env.GEMINI_MODEL || 'gemini-2.5-flash',
};
