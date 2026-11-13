import { useEffect } from 'react';
import Lenis from 'lenis';

/** Smooth scrolling (Lenis) and smooth in-page anchor links. */
export function useSmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lenis = null;
    let raf = 0;
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1 });
      document.documentElement.classList.add('lenis');
      const loop = (t) => {
        lenis.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    const onClick = (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const y = el.getBoundingClientRect().top + window.scrollY - 90;
      if (lenis) lenis.scrollTo(y, { duration: 1.4 });
      else window.scrollTo({ top: y, behavior: 'smooth' });
    };
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      cancelAnimationFrame(raf);
      lenis?.destroy();
      document.documentElement.classList.remove('lenis');
    };
  }, []);
}

/**
 * Pointer-driven polish on the landing page: card spotlight, 3D tilt on floating cards,
 * magnetic buttons, the product frame that flattens as you scroll, and the nav shadow.
 * Everything is scoped to `rootRef` and removed on unmount.
 */
export function useLandingMotion(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const A = (s) => [...root.querySelectorAll(s)];
    const offs = [];
    const on = (el, ev, fn, opts) => {
      el.addEventListener(ev, fn, opts);
      offs.push(() => el.removeEventListener(ev, fn, opts));
    };

    A('.card,.tiles a,.stp,.pe,.use,.ph').forEach((e) => {
      on(e, 'pointermove', (ev) => {
        const b = e.getBoundingClientRect();
        e.style.setProperty('--mx', ((ev.clientX - b.left) / b.width) * 100 + '%');
        e.style.setProperty('--my', ((ev.clientY - b.top) / b.height) * 100 + '%');
      }, { passive: true });
    });

    const TS = [];
    A('.tilt,.fo').forEach((e) => {
      const s = { e, x: 0, y: 0, tx: 0, ty: 0 };
      TS.push(s);
      on(e, 'pointermove', (ev) => {
        const b = e.getBoundingClientRect();
        s.tx = (ev.clientX - b.left) / b.width - 0.5;
        s.ty = (ev.clientY - b.top) / b.height - 0.5;
      }, { passive: true });
      on(e, 'pointerleave', () => { s.tx = 0; s.ty = 0; });
    });

    const MS = [];
    A('.btn').forEach((e) => {
      const s = { e, x: 0, y: 0, tx: 0, ty: 0 };
      MS.push(s);
      on(e, 'pointermove', (ev) => {
        const b = e.getBoundingClientRect();
        s.tx = (ev.clientX - b.left - b.width / 2) * 0.14;
        s.ty = (ev.clientY - b.top - b.height / 2) * 0.28;
      }, { passive: true });
      on(e, 'pointerleave', () => { s.tx = 0; s.ty = 0; });
    });

    const fm = root.querySelector('.st3d .frame');
    const px = A('.px');
    const nav = root.querySelector('.nav');
    const big = window.innerWidth > 980;
    let fk = 0;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      nav?.classList.toggle('scrolled', window.scrollY > 40);
      TS.forEach((s) => {
        const dx = s.tx - s.x;
        const dy = s.ty - s.y;
        if (Math.abs(dx) > 0.0004 || Math.abs(dy) > 0.0004) {
          s.x += dx * 0.11;
          s.y += dy * 0.11;
          s.e.style.transform = 'perspective(700px) rotateY(' + s.x * 14 + 'deg) rotateX(' + -s.y * 14 + 'deg) translateZ(6px)';
        }
      });
      MS.forEach((s) => {
        const dx = s.tx - s.x;
        const dy = s.ty - s.y;
        if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
          s.x += dx * 0.18;
          s.y += dy * 0.18;
          s.e.style.transform = 'translate3d(' + s.x + 'px,' + s.y + 'px,0)';
        } else if (s.x || s.y) {
          s.x = s.y = 0;
          s.e.style.transform = '';
        }
      });
      if (fm && big) {
        const r = fm.parentNode.getBoundingClientRect();
        const k = Math.max(0, Math.min(1, (window.innerHeight - r.top) / (window.innerHeight * 0.85)));
        fk += (k - fk) * 0.1;
        fm.style.transform = 'rotateX(' + (16 - 16 * fk).toFixed(2) + 'deg) scale(' + (0.93 + 0.07 * fk).toFixed(4) + ')';
      }
      px.forEach((e) => {
        const r = e.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) {
          e.style.setProperty('--py', ((r.top + r.height / 2 - window.innerHeight / 2) * -0.12).toFixed(1) + 'px');
        }
      });
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      offs.forEach((f) => f());
    };
  }, [rootRef]);
}
