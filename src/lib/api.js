/* Tiny fetch wrapper for the FinWise API. Cookies carry the session (httpOnly, set by the server). */
const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '') + '/api';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }
  let data = null;
  try { data = await res.json(); } catch (e) { /* empty or non-JSON body */ }
  if (!res.ok) {
    // A 401 outside the login forms means the session ended: let the app send the user to /login.
    if (res.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/signup')) {
      window.dispatchEvent(new Event('fw:unauthorized'));
    }
    throw new ApiError(res.status, (data && data.error) || 'Something went wrong. Please try again.');
  }
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b = {}) => request('POST', p, b),
  put: (p, b = {}) => request('PUT', p, b),
  patch: (p, b = {}) => request('PATCH', p, b),
  del: (p) => request('DELETE', p),
};
