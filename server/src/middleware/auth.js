import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from './errors.js';

export const COOKIE = 'fw_session';

export function setSession(res, userId) {
  const token = jwt.sign({}, config.jwtSecret, { subject: userId, expiresIn: `${config.sessionDays}d` });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    maxAge: config.sessionDays * 864e5,
    path: '/',
  });
}

export function clearSession(res) {
  res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'lax', secure: config.isProd, path: '/' });
}

/** Requires a valid session cookie and sets req.userId. */
export function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE];
  if (!token) return next(new HttpError(401, 'Please log in.'));
  try {
    req.userId = jwt.verify(token, config.jwtSecret).sub;
    return next();
  } catch (e) {
    return next(new HttpError(401, 'Your session has expired. Please log in again.'));
  }
}

/** Defence in depth on top of SameSite=Lax: reject cross-site browser writes. */
export function originCheck(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && !config.clientOrigins.includes(origin) && origin !== `${req.protocol}://${req.get('host')}`) {
    return next(new HttpError(403, 'Origin not allowed.'));
  }
  return next();
}
