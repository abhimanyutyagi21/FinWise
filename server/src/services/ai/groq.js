import { config } from '../../config.js';
import { SYSTEM, httpError, userText } from './shared.js';

/** Groq: OpenAI-compatible chat completions. Free plan available. */
export const groq = {
  name: 'groq',
  enabled: () => Boolean(config.groqKey),
  models: () => [config.groqModel, config.groqFallbackModel].filter((m, i, a) => m && a.indexOf(m) === i),

  async call(model, { question, data, signal }) {
    const body = {
      model,
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: userText(question, data) }],
      max_completion_tokens: 1800,
      response_format: { type: 'json_object' },
    };
    if (/gpt-oss/.test(model)) body.reasoning_effort = 'low'; // reasoning models: keep thinking short and fast
    else body.temperature = 0.3;

    const post = () => fetch(`${config.groqBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.groqKey}` },
      signal,
      body: JSON.stringify(body),
    });

    let res = await post();
    let text = res.ok ? '' : await res.text();
    // Some models reject JSON mode; retry once without it (the answer is parsed leniently anyway).
    if (res.status === 400 && /response_format|json/i.test(text)) {
      delete body.response_format;
      res = await post();
      text = res.ok ? '' : await res.text();
    }
    if (!res.ok) throw httpError('groq', model, res.status, text);
    const json = await res.json();
    return json?.choices?.[0]?.message?.content || '';
  },
};
