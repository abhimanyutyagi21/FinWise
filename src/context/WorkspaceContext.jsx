import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CURRENCIES, FX_FALLBACK, formatMoney, formatShort, loadRates, rateText, usdTo } from '../lib/currency.js';
import { availableRoom, recurringMonthlyTotal } from '../lib/finance.js';
import { api, ApiError } from '../lib/api.js';
import { useUI } from './UIContext.jsx';

const WorkspaceContext = createContext(null);
export const useWorkspace = () => useContext(WorkspaceContext);

const dayMonth = (iso) => new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
const withDate = (s) => ({ ...s, date: s.createdAt ? dayMonth(s.createdAt) : 'Just now' });

/**
 * Loads the workspace from the API and exposes every action that changes it.
 * Actions wait for the server, update state from its answer, and resolve true on
 * success. On failure they show the server's message and resolve false.
 */
export function WorkspaceProvider({ children }) {
  const { say } = useUI();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | unauthorized | error
  const [loadError, setLoadError] = useState('');
  const dataRef = useRef(null);
  dataRef.current = data;

  const [fx, setFx] = useState({ rates: { ...FX_FALLBACK }, meta: { live: false, ts: 0 } });
  const [fxBusy, setFxBusy] = useState(false);
  const fxBusyRef = useRef(false);

  const reload = useCallback(async () => {
    try {
      const ws = await api.get('/workspace');
      setData({ ...ws, scenarios: ws.scenarios.map(withDate) });
      setStatus('ready');
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setStatus('unauthorized');
      else {
        setLoadError(e.message);
        setStatus((s) => (s === 'ready' ? s : 'error'));
        if (dataRef.current) say(e.message);
      }
      return false;
    }
  }, [say]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => {
    let alive = true;
    loadRates(false).then((r) => { if (alive) setFx(r); });
    return () => { alive = false; };
  }, []);

  const patch = useCallback((p) => setData((d) => ({ ...d, ...(typeof p === 'function' ? p(d) : p) })), []);

  /** Runs a server call; on success applies `apply(result)` to state. */
  const run = useCallback(async (call, apply) => {
    try {
      const result = await call();
      if (apply) apply(result);
      return true;
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) say(e.message);
      return false;
    }
  }, [say]);

  const actions = useMemo(() => ({
    reload,

    updateProfile: (p) => run(() => api.put('/profile', p), () => patch((d) => ({ profile: { ...d.profile, ...p } }))),

    addTransaction: (tx) =>
      run(() => api.post('/transactions', tx), (r) => patch((d) => ({ transactions: [...d.transactions, ...r.transactions] }))),
    deleteTransaction: (id) =>
      run(() => api.del('/transactions/' + id), () => patch((d) => ({ transactions: d.transactions.filter((t) => t.id !== id) }))),

    saveBudget: (category, limit) =>
      run(() => api.put('/budgets/' + encodeURIComponent(category), { limit }), () =>
        patch((d) => ({
          budgets: d.budgets.some((b) => b.category === category)
            ? d.budgets.map((b) => (b.category === category ? { ...b, limit } : b))
            : [...d.budgets, { category, limit }],
        }))),
    removeBudget: (category) =>
      run(() => api.del('/budgets/' + encodeURIComponent(category)), () => patch((d) => ({ budgets: d.budgets.filter((b) => b.category !== category) }))),

    addSubscription: (sub) =>
      run(() => api.post('/subscriptions', sub), (row) => patch((d) => ({ subscriptions: [...d.subscriptions, row] }))),
    removeSubscription: (id) =>
      run(() => api.del('/subscriptions/' + id), () => patch((d) => ({ subscriptions: d.subscriptions.filter((s) => s.id !== id) }))),

    addGoal: (goal) => run(() => api.post('/goals', goal), (row) => patch((d) => ({ goals: [...d.goals, row] }))),
    setGoalSaved: (id, saved) =>
      run(() => api.patch('/goals/' + id, { saved }), (row) => patch((d) => ({ goals: d.goals.map((g) => (g.id === id ? row : g)) }))),
    addToGoal: (id, add) =>
      run(() => api.patch('/goals/' + id, { add }), (row) => patch((d) => ({ goals: d.goals.map((g) => (g.id === id ? row : g)) }))),
    removeGoal: (id) => run(() => api.del('/goals/' + id), () => patch((d) => ({ goals: d.goals.filter((g) => g.id !== id) }))),

    saveScenario: (s) =>
      run(() => api.post('/scenarios', s), (row) => patch((d) => ({ scenarios: [...d.scenarios, withDate(row)] }))),

    completeOnboarding: (v) => run(() => api.post('/onboarding', v), () => reload()),

    /** Converts every stored amount using live rates. Resolves { from, to, k } or null when ignored/failed. */
    async changeCurrency(code) {
      const from = dataRef.current.currency;
      if (!CURRENCIES[code] || code === from || fxBusyRef.current) return null;
      fxBusyRef.current = true;
      setFxBusy(true);
      try {
        const next = await loadRates(true);
        setFx(next);
        const k = next.rates[code] / next.rates[from];
        const ok = await run(() => api.post('/currency/convert', { to: code, factor: k }));
        if (!ok) return null;
        await reload();
        return { from, to: code, k };
      } finally {
        fxBusyRef.current = false;
        setFxBusy(false);
      }
    },

    /** Wipes this account's data on the server and restarts setup. */
    async resetWorkspace() {
      if (await run(() => api.del('/workspace'))) window.location.reload();
    },
  }), [reload, run, patch]);

  const value = useMemo(() => {
    if (!data) return null;
    const currency = data.currency;
    const cur = CURRENCIES[currency] || CURRENCIES.USD;
    return {
      ...data,
      ...actions,
      cur,
      sym: cur.symbol,
      fxBusy,
      rateHint: fxBusy ? 'Getting the latest exchange rate…' : rateText(currency, fx.rates, fx.meta),
      money: (n) => formatMoney(n, currency),
      short: (n) => formatShort(n, currency),
      usd: (n) => usdTo(n, currency, fx.rates),
      available: availableRoom(data.profile, data.subscriptions),
      recurringTotal: recurringMonthlyTotal(data.subscriptions),
    };
  }, [data, actions, fx, fxBusy]);

  if (status === 'unauthorized') return <Navigate to="/login" replace />;
  if (status === 'error' && !data) {
    return (
      <div className="auth"><div className="r" style={{ gridColumn: '1 / -1' }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h2>We couldn’t load your workspace.</h2>
          <p style={{ color: 'var(--sage)', margin: '10px 0 20px' }}>{loadError}</p>
          <button className="btn b1" onClick={() => { setStatus('loading'); reload(); }}>Try again</button>
        </div>
      </div></div>
    );
  }
  if (!value) return <div className="auth"><div className="r" style={{ gridColumn: '1 / -1' }}><p style={{ color: 'var(--sage)' }}>Loading your workspace…</p></div></div>;

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
