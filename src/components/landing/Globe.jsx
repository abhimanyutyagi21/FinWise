import { useEffect, useRef } from 'react';

/** Builds the rotating 3D globe. Returns a cleanup function. */
function initGlobe(c, T) {
  T.ColorManagement.enabled = false; // keep the exact colours the design was made with
  const R = new T.WebGLRenderer({ canvas: c, alpha: true, antialias: true });
  R.outputColorSpace = T.LinearSRGBColorSpace;
  R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const S = new T.Scene();
  const C = new T.PerspectiveCamera(32, 1, 0.1, 100);
  C.position.z = 8.4;
  const G = new T.Group();
  S.add(G);
  G.add(new T.Mesh(new T.SphereGeometry(1.485, 64, 64), new T.MeshBasicMaterial({ color: 0x0c3a22 })));
  G.add(new T.Mesh(new T.SphereGeometry(1.7, 64, 64), new T.MeshBasicMaterial({ color: 0x2fe07a, transparent: true, opacity: 0.07, side: T.BackSide })));

  const P = [];
  const N = 9000;
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = ga * i;
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    const la = Math.asin(y);
    const lo = Math.atan2(z, x);
    const v = Math.sin(lo * 2.1 + 1) * Math.cos(la * 3) + Math.sin(lo * 4.3) * Math.sin(la * 2.2 + 1) * 0.6 + Math.cos(lo * 1.3 + la * 5) * 0.3;
    if (v > 0.22) P.push(x * 1.5, y * 1.5, z * 1.5);
  }
  const gm = new T.BufferGeometry();
  gm.setAttribute('position', new T.Float32BufferAttribute(P, 3));
  G.add(new T.Points(gm, new T.PointsMaterial({ color: 0xa9dfb4, size: 0.017, transparent: true, opacity: 0.9 })));

  const ll = (a, b, k = 1.5) => {
    a *= Math.PI / 180;
    b *= Math.PI / 180;
    return new T.Vector3(k * Math.cos(a) * Math.cos(b), k * Math.sin(a), -k * Math.cos(a) * Math.sin(b));
  };
  const hub = ll(20, 100);
  const dest = [[48, 10], [-25, 135], [38, -100], [-15, -55], [5, 20], [55, 80]];
  const arcs = [];
  dest.forEach((d, i) => {
    const e = ll(d[0], d[1]);
    const m = hub.clone().add(e).multiplyScalar(0.5).normalize().multiplyScalar(2.15);
    const cv = new T.QuadraticBezierCurve3(hub, m, e);
    G.add(new T.Line(new T.BufferGeometry().setFromPoints(cv.getPoints(60)), new T.LineBasicMaterial({ color: 0x7be3a0, transparent: true, opacity: 0.35 })));
    const dot = new T.Mesh(new T.SphereGeometry(0.035, 12, 12), new T.MeshBasicMaterial({ color: 0xeafff0 }));
    G.add(dot);
    arcs.push({ cv, dot, t: i / 6 });
    const pin = new T.Mesh(new T.SphereGeometry(0.028, 12, 12), new T.MeshBasicMaterial({ color: 0x4cf08c }));
    pin.position.copy(e);
    G.add(pin);
  });
  const hp = new T.Mesh(new T.SphereGeometry(0.06, 16, 16), new T.MeshBasicMaterial({ color: 0xffffff }));
  hp.position.copy(hub);
  G.add(hp);
  const ring = new T.Mesh(new T.RingGeometry(0.09, 0.1, 40), new T.MeshBasicMaterial({ color: 0x4cf08c, transparent: true, side: T.DoubleSide }));
  ring.position.copy(hub.clone().multiplyScalar(1.01));
  ring.lookAt(0, 0, 0);
  G.add(ring);
  const orb = new T.Mesh(new T.TorusGeometry(1.95, 0.004, 8, 200), new T.MeshBasicMaterial({ color: 0xa9dfb4, transparent: true, opacity: 0.35 }));
  orb.rotation.x = 1.2;
  orb.rotation.y = 0.3;
  S.add(orb);

  const cc = document.createElement('canvas');
  cc.width = cc.height = 128;
  const cx = cc.getContext('2d');
  cx.fillStyle = '#c4f2cf';
  cx.fillRect(0, 0, 128, 128);
  cx.strokeStyle = '#2fb865';
  cx.lineWidth = 9;
  cx.beginPath();
  cx.arc(64, 64, 50, 0, 7);
  cx.stroke();
  cx.fillStyle = '#0a6b31';
  cx.font = '600 74px sans-serif';
  cx.textAlign = 'center';
  cx.textBaseline = 'middle';
  cx.fillText('$', 64, 68);
  const tex = new T.CanvasTexture(cc);
  const cm = [new T.MeshBasicMaterial({ color: 0x7fd498 }), new T.MeshBasicMaterial({ map: tex }), new T.MeshBasicMaterial({ map: tex })];
  const coins = [];
  for (let i = 0; i < 5; i++) {
    const cn = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 0.03, 48), cm);
    cn.userData = { a: i * 1.26, r: 1.95, s: 0.25 + i * 0.04 };
    S.add(cn);
    coins.push(cn);
  }

  let tx = 0, ty = 0, drag = false, lx = 0, ly = 0, rx = 0.25;
  const vx = 0.0035;
  G.rotation.y = -1.7;

  const onDown = (e) => { drag = true; lx = e.clientX; ly = e.clientY; c.setPointerCapture(e.pointerId); };
  const onUp = () => { drag = false; };
  const onMove = (e) => {
    if (drag) {
      G.rotation.y += (e.clientX - lx) * 0.006;
      rx = Math.max(-0.6, Math.min(0.9, rx + (e.clientY - ly) * 0.004));
      lx = e.clientX;
      ly = e.clientY;
    }
    tx = e.clientX / window.innerWidth - 0.5;
    ty = e.clientY / window.innerHeight - 0.5;
  };
  const rs = () => {
    const b = c.parentNode.getBoundingClientRect();
    const s = Math.min(b.width * 1.12, 760);
    R.setSize(s, s, false);
    c.style.width = s + 'px';
    c.style.height = s + 'px';
  };
  c.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('resize', rs);
  rs();

  const red = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let k = 0;
  let raf = 0;
  (function A() {
    raf = requestAnimationFrame(A);
    k += 0.016;
    if (!drag && !red) G.rotation.y += vx;
    G.rotation.x += (rx + ty * 0.15 - G.rotation.x) * 0.05;
    S.rotation.y += (tx * 0.25 - S.rotation.y) * 0.04;
    arcs.forEach((a) => {
      a.t = (a.t + 0.004) % 1;
      a.dot.position.copy(a.cv.getPoint(a.t));
    });
    const q = (k % 2) / 2;
    ring.scale.setScalar(1 + q * 3);
    ring.material.opacity = 1 - q;
    coins.forEach((n) => {
      const u = n.userData;
      u.a += 0.006 * u.s * 4;
      n.position.set(Math.cos(u.a) * u.r, Math.sin(u.a * 1.3) * 0.8, Math.sin(u.a) * u.r * 0.55);
      n.rotation.x = u.a * 2;
      n.rotation.z = u.a;
    });
    R.render(S, C);
  })();

  return () => {
    cancelAnimationFrame(raf);
    c.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('resize', rs);
    R.dispose();
    R.forceContextLoss();
  };
}

/** three.js is loaded on demand so the landing page paints before the 3D bundle arrives. */
export default function Globe({ onFail }) {
  const ref = useRef(null);
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    import('three')
      .then((T) => {
        if (disposed || !ref.current) return;
        cleanup = initGlobe(ref.current, T);
      })
      .catch(() => onFail?.());
    return () => {
      disposed = true;
      cleanup();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <canvas id="globe" ref={ref} aria-label="Interactive 3D globe. Drag to rotate."></canvas>;
}
