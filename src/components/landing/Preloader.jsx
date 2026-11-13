import { useEffect, useRef, useState } from 'react';

/** Full-screen counter shown for ~1.6s on the landing page. Calls onDone once the page is ready. */
export default function Preloader({ onDone }) {
  const [out, setOut] = useState(false);
  const [gone, setGone] = useState(false);
  const pn = useRef(null);
  const pb = useRef(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setGone(true);
      doneRef.current();
      return undefined;
    }
    let raf = 0;
    let removeTimer = 0;
    const t0 = performance.now();
    const f = (t) => {
      const k = Math.min(1, (t - t0) / 1600);
      const v = Math.round(100 * (1 - Math.pow(1 - k, 3)));
      if (pn.current) pn.current.textContent = v;
      if (pb.current) pb.current.style.transform = 'scaleX(' + v / 100 + ')';
      if (k < 1) raf = requestAnimationFrame(f);
      else {
        setOut(true);
        removeTimer = setTimeout(() => setGone(true), 1000);
        doneRef.current();
      }
    };
    f(t0);
    // Safety net: never block the page for more than 4.5s.
    const failsafe = setTimeout(() => {
      doneRef.current();
      setGone(true);
    }, 4500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(removeTimer);
      clearTimeout(failsafe);
    };
  }, []);

  if (gone) return null;
  return (
    <div id="pl" className={'pl' + (out ? ' out' : '')}>
      <div className="plc">
        <div className="plm"><i></i><span className="r1"></span><span className="r2"></span></div>
        <div className="pn"><b id="pn" ref={pn}>0</b>%</div>
        <div className="pbt"><i id="pb" ref={pb}></i></div>
        <small>Building your financial picture</small>
      </div>
    </div>
  );
}
