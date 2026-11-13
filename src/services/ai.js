/*
 * AI analysis goes through the FinWise server, which holds the Gemini key.
 * GET  /api/ai/health   200 => the AI page shows "Connected"
 * POST /api/ai/analyze  body from buildAiPayload() => { summary, insights, recommendations }
 */
import { api } from '../lib/api.js';

export async function checkAiHealth() {
  try {
    await api.get('/ai/health');
    return true;
  } catch (e) {
    return false;
  }
}

export const analyze = (payload) => api.post('/ai/analyze', payload);
