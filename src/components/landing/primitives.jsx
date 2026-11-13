import { Fragment, useEffect, useRef, useState } from 'react';

/** Fades/slides its children in when scrolled into view. Replaces the old ".rv" script. */
export function Reveal({ className = '', children, ...rest }) {
  const ref = useRef(null);
  const [st, setSt] = useState({ in: false, done: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    [...el.children].forEach((c, i) => c.style.setProperty('--i', i));
    let timer = 0;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((x) => {
          if (!x.isIntersecting) return;
          io.unobserve(el);
          setSt((s) => ({ ...s, in: true }));
          timer = setTimeout(() => setSt((s) => ({ ...s, done: true })), 1200 + el.children.length * 90);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={ref} className={`${className} rv${st.in ? ' in' : ''}${st.done ? ' done' : ''}`} {...rest}>
      {children}
    </div>
  );
}

/** Number that counts up the first time it is visible (after the preloader finishes). */
export function CountUp({ to, pre = '', suf = '' }) {
  const ref = useRef(null);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const el = ref.current;
    let raf = 0;
    let poll = 0;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((x) => {
          if (!x.isIntersecting) return;
          io.unobserve(el);
          const start = () => {
            if (!document.body.classList.contains('ready')) {
              poll = setTimeout(start, 120);
              return;
            }
            const t0 = performance.now();
            const f = (t) => {
              const k = Math.min(1, (t - t0) / 1800);
              setVal(Math.round(to * (1 - Math.pow(1 - k, 4))));
              if (k < 1) raf = requestAnimationFrame(f);
            };
            f(t0);
          };
          start();
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(poll);
      cancelAnimationFrame(raf);
    };
  }, [to]);

  return <b ref={ref}>{pre}{val.toLocaleString('en-US')}{suf}</b>;
}

/** Wraps every word in a span so the hero headline can animate word by word. */
export function Words({ text, start = 0 }) {
  const words = text.split(/\s+/).filter(Boolean);
  return words.map((w, k) => (
    <Fragment key={k}>
      <span className="w" style={{ '--d': (start + k) * 80 + 'ms' }}>{w}</span>
      {k < words.length - 1 ? ' ' : null}
    </Fragment>
  ));
}

/** Browser-style frame around a product screenshot. */
export function Frame({ src, alt, big = false }) {
  return (
    <div className={'frame' + (big ? ' big' : '')}>
      <div className="fbar"><i></i><i></i><i></i><span>FinWise workspace</span></div>
      <img src={src} alt={alt} />
    </div>
  );
}

/** Remote photo that simply disappears if it cannot load (the gradient behind it stays). */
export function RemoteImg({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img src={src} alt={alt} onError={() => setFailed(true)} />;
}
