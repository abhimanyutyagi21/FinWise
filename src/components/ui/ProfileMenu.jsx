import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CURRENCIES } from '../../lib/currency.js';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useAccountActions } from '../../hooks/useAccountActions.js';

/** Floating account menu anchored to the avatar buttons. */
export default function ProfileMenu({ anchor, onClose }) {
  const ws = useWorkspace();
  const { changeName, changeCurrency, logOut } = useAccountActions(onClose);
  const ref = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [shown, setShown] = useState(false);
  const name = (ws.profile.name || '').trim();
  const initial = (name[0] || 'F').toUpperCase();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !anchor) return;
    const w = el.offsetWidth;
    const r = anchor.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)) });
  }, [anchor]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    ref.current?.querySelector('button')?.focus();
    const down = (e) => {
      if (ref.current && !ref.current.contains(e.target) && !anchor.contains(e.target)) onClose();
    };
    const key = (e) => {
      if (e.key === 'Escape') {
        onClose();
        anchor.focus();
      }
    };
    document.addEventListener('pointerdown', down);
    document.addEventListener('keydown', key);
    window.addEventListener('resize', onClose);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('keydown', key);
      window.removeEventListener('resize', onClose);
    };
  }, [anchor, onClose]);

  return createPortal(
    <div ref={ref} className={'pmenu' + (shown ? ' in' : '')} role="menu" style={{ top: pos.top, left: pos.left }}>
      <div className="pm-head">
        <div className="pm-av">{initial}</div>
        <div><b>{name || 'Your workspace'}</b><small>Personal finances</small></div>
      </div>
      <button className="pm-item" role="menuitem" onClick={changeName}><span>✎</span>Change name</button>
      <div className="pm-cur">
        <label htmlFor="pmCur">Currency</label>
        <select id="pmCur" value={ws.currency} disabled={ws.fxBusy} onChange={(e) => changeCurrency(e.target.value)}>
          {Object.keys(CURRENCIES).map((k) => (
            <option key={k} value={k}>{k} · {CURRENCIES[k].name} ({CURRENCIES[k].symbol})</option>
          ))}
        </select>
        <small id="pmRate">{ws.rateHint}</small>
      </div>
      <div className="pm-sep"></div>
      <button className="pm-item danger" role="menuitem" onClick={logOut}><span>⎋</span>Log out</button>
    </div>,
    document.body,
  );
}
