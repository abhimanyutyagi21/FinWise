import { useLayoutEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../lib/auth.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

const COPY = {
  login: {
    title: 'Log in to FinWise',
    headline: <>Welcome <span className="s">back.</span></>,
    heading: 'Log in',
    sub: 'Welcome back. Pick up where you left off.',
    password: 'Enter your password',
    button: 'Open workspace',
    switchText: <>New here? <Link to="/signup">Sign up</Link> · <Link to="/">Back to site</Link></>,
  },
  signup: {
    title: 'Create your FinWise workspace',
    headline: <>Start with your <span className="s">own numbers.</span></>,
    heading: 'Create your workspace',
    sub: 'Set up your workspace in a few seconds.',
    password: 'Create a password (8+ characters)',
    button: 'Create workspace',
    switchText: <>Already have a workspace? <Link to="/login">Log in</Link> · <Link to="/">Back to site</Link></>,
  },
};

/** Sign-in / sign-up screens. The API calls live in lib/auth.js. */
export default function Auth({ mode }) {
  const c = COPY[mode];
  useDocumentTitle(c.title);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useLayoutEffect(() => {
    document.body.classList.remove('leaving');
    return () => document.body.classList.remove('leaving');
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await (mode === 'login' ? auth.signIn(email, password) : auth.signUp(email, password));
    } catch (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    document.body.classList.add('leaving');
    setTimeout(() => navigate('/app'), 420);
  };

  return (
    <div className="auth">
      <div className="l dk">
        <Link className="logo" to="/"><i></i><span>fin<b>wise</b></span></Link>
        <div>
          <h1>{c.headline}</h1>
          <p>Track spending, budgets and goals, then test decisions in Decision Studio.</p>
        </div>
        <div style={{ fontSize: '.8rem', color: '#8fb09a' }}>Not financial advice.</div>
      </div>
      <div className="r">
        <form id="f" onSubmit={submit}>
          <h2>{c.heading}</h2>
          <p style={{ color: 'var(--sage)' }}>{c.sub}</p>
          <div className="fld">
            <label htmlFor="e">Email</label>
            <input id="e" type="email" placeholder="you@example.com" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="fld">
            <label htmlFor="p">Password</label>
            <input id="p" type="password" placeholder={c.password} required minLength={mode === 'signup' ? 8 : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div role="alert" style={{ color: '#a33b2a', fontSize: '.88rem', minHeight: 22, margin: '4px 0 10px' }}>{error}</div>
          <button className="btn b1" type="submit" disabled={busy}>{busy ? 'Please wait…' : c.button}</button>
          <div className="sw2">{c.switchText}</div>
        </form>
      </div>
    </div>
  );
}
