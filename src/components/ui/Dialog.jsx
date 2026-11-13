import { useEffect, useRef, useState } from 'react';

/**
 * Accessible modal used for confirms, alerts and small forms.
 * Rendered by UIProvider; resolves the promise returned by useUI().dialog().
 * Resolves: true / false (no fields) or the trimmed field values / null (with fields).
 */
export default function Dialog({ opts, resolve, onClosed }) {
  const fields = opts.fields || [];
  const [phase, setPhase] = useState('mount'); // mount -> in -> out
  const [vals, setVals] = useState(() => Object.fromEntries(fields.map((f) => [f.id, f.value == null ? '' : String(f.value)])));
  const [err, setErr] = useState('');
  const elRef = useRef(null);
  const cardRef = useRef(null);
  const valsRef = useRef(vals);
  const closedRef = useRef(false);
  const prevFocus = useRef(typeof document !== 'undefined' ? document.activeElement : null);
  valsRef.current = vals;
  const cancelVal = fields.length ? null : false;

  const shake = () => {
    const c = cardRef.current;
    if (!c) return;
    c.classList.remove('shake');
    void c.offsetWidth; // restart the CSS animation
    c.classList.add('shake');
  };

  const close = (value) => {
    if (closedRef.current) return;
    closedRef.current = true;
    setPhase('out');
    resolve(value);
    setTimeout(() => {
      onClosed();
      const p = prevFocus.current;
      if (p && p.focus) p.focus();
    }, 240);
  };

  const submit = () => {
    const out = {};
    fields.forEach((f) => { out[f.id] = String(valsRef.current[f.id] ?? '').trim(); });
    if (opts.validate) {
      const m = opts.validate(out);
      if (m) {
        setErr(m);
        shake();
        return;
      }
    }
    close(fields.length ? out : true);
  };

  // Latest handlers for the document-level key listener.
  const handlers = useRef({});
  handlers.current = { submit, close: () => close(cancelVal) };

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase((p) => (p === 'mount' ? 'in' : p)));
    const focusTimer = setTimeout(() => {
      const el = elRef.current;
      if (!el) return;
      (el.querySelector('input') || el.querySelector('[data-ok]'))?.focus();
    }, 70);

    const onKey = (e) => {
      const el = elRef.current;
      if (!el) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handlers.current.close();
      } else if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
        e.preventDefault();
        handlers.current.submit();
      } else if (e.key === 'Tab') {
        const n = [...el.querySelectorAll('input,button')];
        const i = n.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) {
          e.preventDefault();
          n[n.length - 1].focus();
        } else if (!e.shiftKey && i === n.length - 1) {
          e.preventDefault();
          n[0].focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey, true);
    };
  }, []);

  return (
    <div
      ref={elRef}
      className={'dlg' + (phase === 'in' ? ' in' : phase === 'out' ? ' out' : '')}
      role={opts.hideCancel ? 'alertdialog' : 'dialog'}
      aria-modal="true"
      aria-labelledby="dlgT"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !opts.hideCancel) close(cancelVal);
      }}
    >
      <div ref={cardRef} className={'dlg-card' + (opts.danger ? ' danger' : '')}>
        <div className="dlg-ic">{opts.danger ? '!' : opts.icon || 'i'}</div>
        <h2 id="dlgT">{opts.title}</h2>
        {opts.message ? <p>{opts.message}</p> : null}
        {fields.map((f) => (
          <div className="dlg-f" key={f.id}>
            <label htmlFor={'dlg_' + f.id}>{f.label}</label>
            <input
              id={'dlg_' + f.id}
              type="text"
              inputMode={f.number ? 'decimal' : undefined}
              value={vals[f.id]}
              onChange={(e) => setVals((v) => ({ ...v, [f.id]: e.target.value }))}
              placeholder={f.placeholder || ''}
              maxLength={f.max || 60}
              autoComplete="off"
            />
          </div>
        ))}
        <div className="dlg-err" role="alert">{err}</div>
        <div className="dlg-act">
          {opts.hideCancel ? null : (
            <button type="button" className="button-quiet" onClick={() => close(cancelVal)}>{opts.cancelText || 'Cancel'}</button>
          )}
          <button type="button" className={opts.danger ? 'button-danger' : 'button-dark'} data-ok onClick={submit}>
            {opts.confirmText || 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
