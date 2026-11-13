import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Dialog from '../components/ui/Dialog.jsx';

const UIContext = createContext(null);
export const useUI = () => useContext(UIContext);

/** Toast messages and promise-based dialogs (confirm / alert / small forms). */
export function UIProvider({ children }) {
  const [toast, setToast] = useState({ text: '', show: false });
  const timer = useRef(0);
  const [dialogs, setDialogs] = useState([]);
  const idRef = useRef(0);

  const say = useCallback((text) => {
    setToast({ text, show: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2600);
  }, []);

  const dialog = useCallback(
    (opts) => new Promise((resolve) => {
      const id = ++idRef.current;
      setDialogs((d) => [...d, { id, opts, resolve }]);
    }),
    [],
  );
  const confirm = useCallback((title, message, o = {}) => dialog({ title, message, ...o }), [dialog]);
  const alert = useCallback((title, message) => dialog({ title, message, hideCancel: true, confirmText: 'Got it' }), [dialog]);

  const value = useMemo(() => ({ say, dialog, confirm, alert }), [say, dialog, confirm, alert]);

  return (
    <UIContext.Provider value={value}>
      {children}
      <div id="toast" className={'toast' + (toast.show ? ' show' : '')} role="status">{toast.text}</div>
      {dialogs.map((d) => (
        <Dialog key={d.id} opts={d.opts} resolve={d.resolve} onClosed={() => setDialogs((list) => list.filter((x) => x.id !== d.id))} />
      ))}
    </UIContext.Provider>
  );
}
