/* Sign in / up / out against the FinWise API. The session itself is an httpOnly cookie. */
import { api } from './api.js';

export const auth = {
  signIn: (email, password) => api.post('/auth/login', { email, password }),
  signUp: (email, password) => api.post('/auth/signup', { email, password }),
  signOut: () => api.post('/auth/logout').catch(() => {}),
  me: () => api.get('/auth/me'),
};
