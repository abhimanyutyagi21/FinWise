import { config } from '../../config.js';
import { SYSTEM, httpError, userText } from './shared.js';

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    insights: { type: 'ARRAY', items: { type: 'OBJECT', properties: { title: { type: 'STRING' }, detail: { type: 'STRING' } }, required: ['title', 'detail'] } },
    recommendations: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['summary', 'insights', 'recommendations'],
};

function generationConfigFor(model) {
  const isGemini3 = /gemini-3/.test(model);
  const budget = config.geminiThinkingBudget ?? (/gemini-2\.5-flash/.test(model) ? 0 : undefined);
  const level = config.geminiThinkingLevel || (isGemini3 && /flash/.test(model) ? 'low' : '');
  const gc = { maxOutputTokens: 2048, responseMimeType: 'application/json', responseSchema: SCHEMA };
  if (!isGemini3) gc.temperature = 0.3; // Gemini 3 works best at its default temperature
  if (isGemini3 || config.geminiThinkingLevel) {
    if (level) gc.thinkingConfig = { thinkingLevel: level };
  } else if (budget !== undefined && Number.isFinite(budget)) {
    gc.thinkingConfig = { thinkingBudget: budget };
  }
  return gc;
}

/** Google Gemini (generateContent). Free tier available. */
export const gemini = {
  name: 'gemini',
  enabled: () => Boolean(config.geminiKey),
  models: () => [config.geminiModel, config.geminiFallbackModel].filter((m, i, a) => m && a.indexOf(m) === i),

  async call(model, { question, data, signal }) {
    const res = await fetch(`${config.geminiBaseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.geminiKey },
      signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: userText(question, data) }] }],
        generationConfig: generationConfigFor(model),
      }),
    });
    if (!res.ok) throw httpError('gemini', model, res.status, await res.text());
    const json = await res.json();
    return json?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  },
};
