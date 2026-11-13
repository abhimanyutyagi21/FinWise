import { useLayoutEffect, useRef, useState } from 'react';
import { Frame } from './primitives.jsx';
import transactionsImg from '../../assets/transactions.jpg';
import budgetsImg from '../../assets/budgets.jpg';
import goalsImg from '../../assets/goals.jpg';
import { Link } from 'react-router-dom';

/* "Switch it off to see the difference" toggle */
export function Hub() {
  const [off, setOff] = useState(false);
  return (
    <div className={'hub' + (off ? ' off' : '')} id="hub">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <b>One connected workspace</b>
          <div style={{ fontSize: '.82rem', color: 'var(--sage)' }}>Switch it off to see the difference.</div>
        </div>
        <button className="sw" id="sw" onClick={() => setOff((o) => !o)}><i></i>{off ? 'Disconnected' : 'Connected'}</button>
      </div>
      <div className="stage">
        <div className="col">
          <div className="chip">Transactions</div>
          <div className="chip">Budgets</div>
          <div className="chip">Savings goals</div>
        </div>
        <div className="core" role="img" aria-label="FinWise"></div>
        <div className="col">
          <div className="chip">Subscriptions</div>
          <div className="chip">Insights</div>
          <div className="chip">Decision Studio</div>
        </div>
      </div>
      <div style={{ fontSize: '.8rem', color: 'var(--sage)' }} id="hubt">
        {off ? 'Tools sit in separate places, so nothing lines up.' : 'Every entry updates every view.'}
      </div>
    </div>
  );
}

const TABS = [
  {
    id: 'transactions', label: 'Transactions', img: transactionsImg,
    title: 'Every dollar, searchable in a second.',
    text: 'Log income and expenses in seconds, filter by type, search by name, and set entries to repeat monthly.',
    points: ['Search and filter instantly', 'Recurring entries create themselves', 'One-click CSV export'],
  },
  {
    id: 'budgets', label: 'Budgets', img: budgetsImg,
    title: 'Limits that warn you before you overspend.',
    text: 'Set a monthly limit per category. Progress bars move with every expense, and you see exactly what is left.',
    points: ['Per-category monthly limits', 'Percent used and amount left', 'Over-budget alerts in Analytics'],
  },
  {
    id: 'goals', label: 'Savings goals', img: goalsImg,
    title: 'Goals you can feel getting closer.',
    text: 'Name a target, add money whenever you can, and watch the ring fill. Analytics estimates when you will get there.',
    points: ['Progress rings and targets', 'Add savings in one tap', 'Goal timing from your real surplus'],
  },
];

/* Product tour tabs */
export function ProductTabs() {
  const [tab, setTab] = useState('transactions');
  return (
    <div className="wrap">
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={'tb' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <div className="tps">
        {TABS.map((t) => (
          <div key={t.id} className={'tp' + (tab === t.id ? ' on' : '')} id={'tp-' + t.id}>
            <div className="tc">
              <h3>{t.title}</h3>
              <p>{t.text}</p>
              <ul>{t.points.map((p) => <li key={p}>{p}</li>)}</ul>
              <Link className="btn b1" to="/app">Try it yourself <span className="ar">→</span></Link>
            </div>
            <Frame src={t.img} alt={'FinWise ' + t.id} />
          </div>
        ))}
      </div>
    </div>
  );
}

const FAQS = [
  ['What is FinWise?', 'A personal finance workspace that combines transaction tracking, budgets, savings goals, subscriptions, analytics and a decision simulator in one place.'],
  ['How does Decision Studio work?', 'You enter a monthly payment or one-time cost. FinWise subtracts it from the room left after your essentials, commitments, savings and recurring costs, then shows the impact side by side.'],
  ['Can I track subscriptions and recurring bills?', 'Yes. Add weekly, monthly or yearly costs and FinWise converts them to a monthly total and a yearly estimate.'],
  ['Can I export my data?', 'Yes. Export your transactions as CSV, or a full backup as JSON, from Settings.'],
  ['Is this financial advice?', 'No. FinWise gives estimates based on the numbers you enter, to help you think. The decision is always yours.'],
];

/* FAQ accordion. Its height is reserved up front so the page below never jumps. */
export function Faq() {
  const [open, setOpen] = useState(0);
  const accRef = useRef(null);

  useLayoutEffect(() => {
    const fix = () => {
      const acc = accRef.current;
      if (!acc) return;
      acc.style.minHeight = '';
      let base = 0;
      let mx = 0;
      acc.querySelectorAll('.ai').forEach((it) => {
        base += it.querySelector('.aq').offsetHeight + 1;
        mx = Math.max(mx, it.querySelector('.aa p').offsetHeight);
      });
      acc.style.minHeight = base + mx + 2 + 'px';
    };
    fix();
    window.addEventListener('resize', fix);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fix);
    return () => window.removeEventListener('resize', fix);
  }, []);

  return (
    <div className="acc" id="acc" ref={accRef}>
      {FAQS.map(([q, a], i) => (
        <div className={'ai' + (open === i ? ' open' : '')} key={q}>
          <button className="aq" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>{q}<i></i></button>
          <div className="aa"><div><p>{a}</p></div></div>
        </div>
      ))}
    </div>
  );
}

const fmt = (n) => '$' + Math.round(n).toLocaleString('en-US');

/* Live 12-month simulator (plain formulas, no backend) */
export function Simulator() {
  const [inc, setInc] = useState(5200);
  const [exp, setExp] = useState(3800);
  const [goal, setGoal] = useState(10000);

  const s = inc - exp;
  const months = s > 0 ? Math.ceil(goal / s) : null;
  const pts = [];
  for (let k = 0; k <= 12; k++) pts.push([k * 33.3, s > 0 ? 150 - (k / 12) * 130 : 150]);
  const d = pts.map((p, q) => (q ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');

  return (
    <>
      <div>
        <div className="lab">Live Decision Studio</div>
        <h2>Drag a slider. <span className="s">See your future change.</span></h2>
        <p>Real formulas, no black box. Move the numbers and watch twelve months of savings redraw instantly.</p>
        <div className="sl">
          <label>Monthly income <b id="vi">{fmt(inc)}</b></label>
          <input type="range" id="i" min="1500" max="15000" step="100" value={inc} onChange={(e) => setInc(+e.target.value)} />
        </div>
        <div className="sl">
          <label>Monthly expenses <b id="ve">{fmt(exp)}</b></label>
          <input type="range" id="e" min="500" max="14000" step="100" value={exp} onChange={(e) => setExp(+e.target.value)} />
        </div>
        <div className="sl">
          <label>Goal target <b id="vg">{fmt(goal)}</b></label>
          <input type="range" id="g" min="1000" max="50000" step="500" value={goal} onChange={(e) => setGoal(+e.target.value)} />
        </div>
      </div>
      <div className="out">
        <div className="og">
          <div><small>Monthly surplus</small><b id="o1">{(s < 0 ? '-' : '') + fmt(Math.abs(s))}</b></div>
          <div><small>Saved in 12 months</small><b id="o2">{(s < 0 ? '-' : '') + fmt(Math.abs(s * 12))}</b></div>
          <div><small>Goal reached in</small><b id="o3">{months ? (months > 600 ? '50+ years' : months + ' months') : 'Never'}</b></div>
        </div>
        <svg viewBox="0 0 400 170" id="sv">
          <path id="sa" fill="#a9dfb422" d={d + ' L400 160 L0 160Z'} />
          <path id="sl2" fill="none" stroke="#a9dfb4" strokeWidth="3" strokeLinecap="round" d={d} />
          <circle id="sd" r="5" fill="#fff" cx={pts[12][0]} cy={pts[12][1]} />
        </svg>
        <p id="o4" className="ex">
          {s > 0
            ? `Formula: (${fmt(inc)} - ${fmt(exp)}) × 12 = ${fmt(s * 12)} saved. Goal = ${fmt(goal)} ÷ ${fmt(s)} per month.`
            : `Expenses exceed income by ${fmt(-s)} a month. Lower costs or raise income to start saving.`}
        </p>
      </div>
    </>
  );
}
