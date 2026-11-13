/* Confetti + fireworks canvas used by the onboarding finish screen. Returns a cancel function. */
export function celebrate(host) {
  const c = document.createElement('canvas');
  c.className = 'ob-confetti';
  host.appendChild(c);
  const x = c.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W, H;
  let raf = 0;
  const timers = [];
  let stopped = false;

  const rs = () => {
    W = window.innerWidth;
    H = window.innerHeight;
    c.width = W * dpr;
    c.height = H * dpr;
  };
  rs();
  window.addEventListener('resize', rs);

  const COL = ['#0a9a3e', '#2fe07a', '#18b552', '#7fe3a0', '#a9dfb4', '#0f5a2e', '#f1d58a', '#0a9a3e'];
  const SPK = ['#0a9a3e', '#18b552', '#2fe07a', '#0f5a2e', '#e5b94a'];
  const P = [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  function confetti(ox, oy, ang, n, pow) {
    for (let i = 0; i < n; i++) {
      const a = ((ang + rnd(-28, 28)) * Math.PI) / 180;
      const s = rnd(0.55, 1) * pow;
      P.push({ t: 'r', x: ox, y: oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, w: rnd(6, 11), h: rnd(3, 6), r: rnd(0, 6.28), vr: rnd(-0.25, 0.25), c: pick(COL), l: 0, max: rnd(110, 170) });
    }
  }
  function burst(ox, oy, n) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, 6.28);
      const s = rnd(1.5, 6.5);
      P.push({ t: 's', x: ox, y: oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c: pick(SPK), tr: [], l: 0, max: rnd(50, 85) });
    }
  }
  function rocket(px, delay, apex) {
    timers.push(setTimeout(() => P.push({ t: 'k', x: px, y: H + 10, vx: rnd(-0.6, 0.6), vy: -rnd(15, 17), tr: [], ay: apex, l: 0 }), delay));
  }

  confetti(-10, H + 10, -62, 70, 26);
  confetti(W + 10, H + 10, -118, 70, 26);
  rocket(W * 0.28, 260, H * 0.3);
  rocket(W * 0.5, 520, H * 0.2);
  rocket(W * 0.72, 780, H * 0.32);
  timers.push(setTimeout(() => confetti(W * 0.5, H * 0.55, -90, 60, 20), 1500));

  const t0 = performance.now();
  let last = t0;

  function cancel() {
    stopped = true;
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    c.remove();
    window.removeEventListener('resize', rs);
  }

  (function frame(t) {
    if (stopped) return;
    const dt = Math.min(2, (t - last) / 16.67);
    last = t;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, W, H);
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.l += dt;
      if (p.t === 'r') {
        p.vx *= 0.985;
        p.vy = p.vy * 0.985 + 0.42 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.r += p.vr * dt;
        const a = Math.max(0, 1 - Math.max(0, p.l - p.max * 0.6) / (p.max * 0.4));
        x.save();
        x.globalAlpha = a;
        x.translate(p.x, p.y);
        x.rotate(p.r);
        x.scale(1, Math.cos(p.l * 0.18));
        x.fillStyle = p.c;
        x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        x.restore();
        if (p.l > p.max || p.y > H + 40) P.splice(i, 1);
      } else if (p.t === 's') {
        p.vx *= 0.965;
        p.vy = p.vy * 0.965 + 0.07 * dt;
        p.tr.push(p.x, p.y);
        if (p.tr.length > 12) p.tr.splice(0, 2);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const a = Math.max(0, 1 - p.l / p.max);
        x.strokeStyle = p.c;
        x.lineCap = 'round';
        for (let k = 2; k < p.tr.length; k += 2) {
          x.globalAlpha = (a * k) / p.tr.length;
          x.lineWidth = 2;
          x.beginPath();
          x.moveTo(p.tr[k - 2], p.tr[k - 1]);
          x.lineTo(p.tr[k], p.tr[k + 1]);
          x.stroke();
        }
        x.globalAlpha = a;
        x.fillStyle = p.c;
        x.beginPath();
        x.arc(p.x, p.y, 2.1, 0, 6.28);
        x.fill();
        if (p.l > p.max) P.splice(i, 1);
      } else {
        p.vy += 0.16 * dt;
        p.tr.push(p.x, p.y);
        if (p.tr.length > 16) p.tr.splice(0, 2);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        x.strokeStyle = '#18b552';
        x.lineCap = 'round';
        for (let k = 2; k < p.tr.length; k += 2) {
          x.globalAlpha = (k / p.tr.length) * 0.85;
          x.lineWidth = 2.6;
          x.beginPath();
          x.moveTo(p.tr[k - 2], p.tr[k - 1]);
          x.lineTo(p.tr[k], p.tr[k + 1]);
          x.stroke();
        }
        x.globalAlpha = 1;
        x.fillStyle = '#0a9a3e';
        x.beginPath();
        x.arc(p.x, p.y, 3, 0, 6.28);
        x.fill();
        if (p.vy > -1.2 || p.y < p.ay) {
          burst(p.x, p.y, 46);
          P.splice(i, 1);
        }
      }
    }
    x.globalAlpha = 1;
    if (P.length || (performance.now() - t0 < 1700 && document.body.contains(c))) raf = requestAnimationFrame(frame);
    else cancel();
  })(last);

  return cancel;
}
