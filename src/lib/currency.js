export const CURRENCIES = {
  USD: { symbol: '$', pre: '$', name: 'US dollar', plural: 'US dollars', locale: 'en-US' },
  INR: { symbol: '₹', pre: '₹', name: 'Indian rupee', plural: 'Indian rupees', locale: 'en-IN' },
  EUR: { symbol: '€', pre: '€', name: 'Euro', plural: 'euros', locale: 'en-US' },
  GBP: { symbol: '£', pre: '£', name: 'British pound', plural: 'British pounds', locale: 'en-GB' },
  JPY: { symbol: '¥', pre: '¥', name: 'Japanese yen', plural: 'Japanese yen', locale: 'en-US', dec: 0 },
  CNY: { symbol: 'CN¥', pre: 'CN¥', name: 'Chinese yuan', plural: 'Chinese yuan', locale: 'en-US' },
  AUD: { symbol: 'A$', pre: 'A$', name: 'Australian dollar', plural: 'Australian dollars', locale: 'en-US' },
  CAD: { symbol: 'C$', pre: 'C$', name: 'Canadian dollar', plural: 'Canadian dollars', locale: 'en-US' },
  SGD: { symbol: 'S$', pre: 'S$', name: 'Singapore dollar', plural: 'Singapore dollars', locale: 'en-US' },
  AED: { symbol: 'AED', pre: 'AED ', name: 'UAE dirham', plural: 'UAE dirhams', locale: 'en-US' },
  CHF: { symbol: 'CHF', pre: 'CHF ', name: 'Swiss franc', plural: 'Swiss francs', locale: 'en-US' },
};

// Used only when the live rate service cannot be reached (units per 1 USD, approximate)
export const FX_FALLBACK = { USD: 1, INR: 88, EUR: 0.86, GBP: 0.75, JPY: 152, CNY: 7.1, AUD: 1.52, CAD: 1.39, SGD: 1.3, AED: 3.6725, CHF: 0.8 };

const FX_KEY = 'finwise-fx';
const FX_URL = 'https://open.er-api.com/v6/latest/USD';

export function formatMoney(n, code = 'USD') {
  n = Number(n) || 0;
  const c = CURRENCIES[code] || CURRENCIES.USD;
  const a = Math.abs(n);
  const dec = c.dec === 0 ? 0 : a < 100 && a % 1 !== 0 ? 2 : 0;
  const s = a.toLocaleString(c.locale, { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return (n < 0 && /[1-9]/.test(s) ? '-' : '') + c.pre + s;
}

export function formatShort(n, code = 'USD') {
  if (code === 'INR' && n >= 100000) return (n / 100000).toFixed(1) + 'L';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(Math.round(n * 10) / 10);
}

// Round a USD sample amount into the active currency for placeholders.
export function usdTo(n, code, rates) {
  const v = n * ((rates && rates[code]) || 1);
  return v >= 1000 ? Math.round(v / 100) * 100 : Math.round(v);
}

export function rateText(code, rates, meta) {
  if (code === 'USD') return 'Base currency. Pick another one to convert every amount.';
  const r = rates[code] || 1;
  const d = meta.ts ? new Date(meta.ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  return (
    '1 USD = ' + (r >= 100 ? r.toFixed(2) : r.toFixed(4)) + ' ' + code + ' · ' +
    (meta.live ? 'market rate' + (d ? ', updated ' + d : '') : 'approximate rate (offline)')
  );
}

/** Resolves to { rates, meta } and never throws: falls back to cached or built-in approximate rates. */
export async function loadRates(force = false) {
  let rates = { ...FX_FALLBACK };
  let meta = { live: false, ts: 0 };
  try {
    const c = JSON.parse(localStorage.getItem(FX_KEY) || 'null');
    if (c && c.rates) {
      rates = { ...FX_FALLBACK, ...c.rates };
      meta = { live: true, ts: c.ts || 0 };
      if (!force && Date.now() - (c.fetched || 0) < 6 * 36e5) return { rates, meta };
    }
  } catch (e) { /* ignore bad cache */ }

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 5000);
  try {
    const r = await fetch(FX_URL, { signal: ctl.signal, cache: 'no-store' });
    if (!r.ok) throw new Error('rate service');
    const d = await r.json();
    if (!d || d.result !== 'success' || !d.rates) throw new Error('rate data');
    const live = {};
    Object.keys(CURRENCIES).forEach((k) => {
      if (Number(d.rates[k]) > 0) live[k] = Number(d.rates[k]);
    });
    live.USD = 1;
    const ts = d.time_last_update_unix ? d.time_last_update_unix * 1000 : Date.now();
    try { localStorage.setItem(FX_KEY, JSON.stringify({ ts, fetched: Date.now(), rates: live })); } catch (e) { /* storage full */ }
    return { rates: { ...FX_FALLBACK, ...live }, meta: { live: true, ts } };
  } catch (e) {
    return { rates, meta };
  } finally {
    clearTimeout(timer);
  }
}
