import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Wraps an async route so rejections reach the error handler. */
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err instanceof ZodError) {
    const first = err.issues[0];
    const where = first && first.path.length ? first.path.join('.') + ': ' : '';
    return res.status(400).json({ error: where + (first ? first.message : 'Invalid request') });
  }
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  if (err && err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
  if (err && err.code === '22003') return res.status(400).json({ error: 'That amount is too large.' });
  console.error(err);
  return res.status(500).json({ error: 'Something went wrong on our side.' });
}
