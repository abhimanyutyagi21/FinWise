import { config } from '../../config.js';
import { HttpError } from '../../middleware/errors.js';
import { ProviderError, clip, parseAnswer } from './shared.js';
import { groq } from './groq.js';
import { gemini } from './gemini.js';

const PROVIDERS = { groq, gemini };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Providers that have a key, in the order set by AI_PROVIDERS. */
const active = () => config.aiProviders.map((n) => PROVIDERS[n]).filter((p) => p && p.enabled());

export const aiEnabled = () => active().length > 0;
export const aiProviderNames = () => active().map((p) => p.name);

function kindOf(e) {
  if (e instanceof ProviderError) return e.kind;
  if (e && e.name === 'AbortError') return 'timeout';
  return 'transient'; // network trouble: worth one more try
}

/**
 * Tries each configured provider in order (each of its models, two tries when it is busy)
 * and returns the first readable answer. Falls through on any failure, including bad keys.
 */
export async function analyze(payload) {
  const providers = active();
  if (!providers.length) throw new HttpError(503, 'AI analysis is not configured on the server.');
  const question = clip(payload.question, 300) || 'Give a short overview of my finances this month.';
  const { question: _q, ...data } = payload; // eslint-disable-line no-unused-vars

  let sawBusy = false;
  let sawTimeout = false;
  for (const p of providers) {
    for (const model of p.models()) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        const started = Date.now();
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), config.aiTimeoutMs);
        try {
          const answer = parseAnswer(await p.call(model, { question, data, signal: ctl.signal }));
          console.log(`AI answered by ${p.name} (${model}) in ${Date.now() - started}ms`);
          return answer;
        } catch (e) {
          const kind = kindOf(e);
          if (!(e instanceof ProviderError)) console.error(`${p.name} request failed after ${Date.now() - started}ms:`, e.name, e.message);
          if (kind === 'timeout') sawTimeout = true;
          if (kind === 'transient') {
            sawBusy = true;
            if (attempt < 2) {
              await sleep(1200);
              continue; // one more try on the same model
            }
          }
          break; // next model / provider
        } finally {
          clearTimeout(timer);
        }
      }
    }
  }
  if (sawBusy) throw new HttpError(503, 'The AI service is busy right now. Please try again in a minute.');
  if (sawTimeout) throw new HttpError(502, 'The AI took too long to respond.');
  throw new HttpError(502, 'The AI service could not answer right now.');
}
