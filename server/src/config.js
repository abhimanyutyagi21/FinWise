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
  // AI analysis: providers are tried in this order; only those with a key are used.
  aiProviders: (env.AI_PROVIDERS || 'groq,gemini').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
  aiTimeoutMs: Number(env.AI_TIMEOUT_MS) || 25000, // per attempt
  groqKey: env.GROQ_API_KEY || '',
  groqModel: env.GROQ_MODEL || 'openai/gpt-oss-120b',
  groqFallbackModel: env.GROQ_FALLBACK_MODEL || '',
  groqBaseUrl: (env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, ''),
  geminiKey: env.GEMINI_API_KEY || '',
  geminiModel: env.GEMINI_MODEL || 'gemini-3.8-flash',
  // Optional second model to try when the main one is busy (503/429), e.g. another Flash model your key can use.
  geminiFallbackModel: env.GEMINI_FALLBACK_MODEL || '',
  geminiBaseUrl: (env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com').replace(/\/$/, ''),
  // Optional. Gemini "thinking" makes answers slow; 0 turns it off (gemini-2.5-flash models accept 0).
  // Left unset, it is switched off automatically for gemini-2.5-flash* models.
  geminiThinkingBudget: env.GEMINI_THINKING_BUDGET !== undefined && env.GEMINI_THINKING_BUDGET !== '' ? Number(env.GEMINI_THINKING_BUDGET) : undefined,
  // Gemini 3 models use a level (minimal/low/medium/high) instead of a token budget. Default: low.
  geminiThinkingLevel: env.GEMINI_THINKING_LEVEL || '',
};
