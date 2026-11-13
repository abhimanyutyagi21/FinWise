import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { celebrate } from '../../lib/celebrate.js';

const buildSteps = (sym) => [
  { t: 'Welcome to FinWise.', s: 'Let’s set up your workspace in about a minute. What should we call you?', f: [['name', 'Your name', 'text', 'Enter your name']] },
  { t: 'What’s your monthly take-home income?', s: 'After tax, the amount that reaches your account each month.', f: [['income', `Monthly income (${sym})`, 'number', 'Enter your monthly income']], req: ['income'] },
  {
    t: 'What does a normal month cost?',
    s: 'Essentials are rent, food, transport and utilities. Commitments are fixed payments such as loans or insurance. Enter 0 if none.',
    f: [
      ['essentials', `Essentials (${sym} per month)`, 'number', 'Enter your monthly essentials'],
      ['commitments', `Fixed commitments (${sym} per month)`, 'number', 'Enter your fixed commitments'],
    ],
  },
  { t: 'How much do you plan to save each month?', s: 'A rough plan is fine. Enter 0 if you are not saving yet. You can change it any time.', f: [['savings', `Planned monthly savings (${sym})`, 'number', 'Enter how much you plan to save']] },
  { t: 'How much do you have saved right now?', s: 'Savings account, cash, anything set aside. This becomes your starting point in Savings goals. Enter 0 if you have none yet.', f: [['saved', `Current savings (${sym})`, 'number', 'Enter your current savings']] },
  {
    t: 'What are you saving toward?',
    s: 'Name your goal and set a target.',
    f: [
      ['goalName', 'Goal name', 'text', 'Enter a name for your goal'],
      ['goalTarget', `Target amount (${sym})`, 'number', 'Enter your target amount'],
    ],
    hint: true,
  },
  { done: true },
];

const EMPTY = { name: '', income: '', essentials: '', commitments: '', savings: '', saved: '', goalName: '', goalTarget: '' };

/**
 * First-run setup. `leaving` plays the fade-out; `onGo(savedAmount)` tells the shell the
 * user finished so it can reveal the workspace and unmount this overlay.
 */
export default function Onboarding({ leaving, onGo }) {
  const { sym, money, completeOnboarding } = useWorkspace();
  const navigate = useNavigate();
  const S = buildSteps(sym);
  const total = S.length - 1;

  const [i, setI] = useState(0);
  const [v, setV] = useState(EMPTY);
  const [dir, setDir] = useState('');
  const [err, setErr] = useState('');
  const [cele, setCele] = useState(null); // { name, saved } once finished
  const rootRef = useRef(null);
  const cardRef = useRef(null);
  const confettiRef = useRef(null);
  const goneRef = useRef(false);
  const cancelConfetti = useRef(null);
  const goTimer = useRef(0);

  const num = (src, k) => Number(String(src[k]).replace(/,/g, ''));
  const sug = () => Math.round(3 * ((num(v, 'essentials') || 0) + (num(v, 'commitments') || 0)));

  // Focus the first field of every step.
  useEffect(() => {
    const t = setTimeout(() => rootRef.current?.querySelector('.ob-card input')?.focus(), 60);
    return () => clearTimeout(t);
  }, [i, cele]);

  useEffect(() => () => {
    clearTimeout(goTimer.current);
    cancelConfetti.current?.();
  }, []);

  const bad = (m) => {
    setErr(m);
    const c = cardRef.current;
    if (!c) return;
    c.classList.remove('shake');
    void c.offsetWidth; // restart the CSS animation
    c.classList.add('shake');
  };

  const next = () => {
    const st = S[i];
    if (i === 0 && !String(v.name).trim()) return bad('Please enter your name so we can greet you.');
    const nv = { ...v };
    for (const f of st.f) {
      if (f[2] !== 'number') continue;
      const raw = String(nv[f[0]]).trim();
      if (raw === '' && !(st.req || []).includes(f[0]) && f[0] !== 'goalTarget') {
        nv[f[0]] = 0;
        continue;
      }
      const x = num(nv, f[0]);
      if (!isFinite(x) || x < 0 || x > 1e9 || raw === '') return bad('Please enter a number, like 2500.');
      if (f[0] === 'income' && x <= 0) return bad('Income needs to be more than 0.');
      if (f[0] === 'goalTarget' && x <= 0) return bad('Please set a target above 0.');
    }
    if (i === 5 && !String(nv.goalName).trim()) return bad('Give your goal a name.');
    setV(nv);
    setErr('');
    setDir('fwd');
    setI(i + 1);
  };

  const back = () => {
    setErr('');
    setDir('back');
    setI(i - 1);
  };

  const go = (saved) => {
    if (goneRef.current) return;
    goneRef.current = true;
    onGo(saved);
  };

  const finish = async () => {
    const name = String(v.name).trim().slice(0, 40);
    const saved = num(v, 'saved') || 0;
    const saved_ok = await completeOnboarding({
      name,
      income: num(v, 'income'),
      essentials: num(v, 'essentials') || 0,
      commitments: num(v, 'commitments') || 0,
      savings: num(v, 'savings') || 0,
      saved,
      goalName: String(v.goalName).trim().slice(0, 40),
      goalTarget: num(v, 'goalTarget'),
    });
    if (!saved_ok) return; // the server's message is already shown as a toast
    navigate('/app/goals');
    setCele({ name, saved });
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!calm && confettiRef.current) cancelConfetti.current = celebrate(confettiRef.current);
    goTimer.current = setTimeout(() => go(saved), calm ? 1800 : 4600);
  };

  const st = S[i];
  const progress = cele ? 100 : Math.round((i / total) * 100);

  let card;
  if (cele) {
    card = (
      <div key="cele" ref={cardRef} className="ob-card ob-cele-card">
        <div className="ob-check">
          <svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="M15 27l8 8 14-16" /></svg>
        </div>
        <h1>Welcome to FinWise{cele.name && cele.name !== 'there' ? ', ' + cele.name : ''}.</h1>
        <p className="ob-s">Your {money(cele.saved)} in savings is in place and your workspace is ready.</p>
        <button className="button-dark" onClick={() => go(cele.saved)}>Go to my workspace ↗</button>
      </div>
    );
  } else if (st.done) {
    const room = num(v, 'income') - num(v, 'essentials') - num(v, 'commitments') - num(v, 'savings');
    const pct = num(v, 'goalTarget') > 0 ? Math.min(100, Math.round((num(v, 'saved') / num(v, 'goalTarget')) * 100)) : 0;
    card = (
      <div key="done" ref={cardRef} className={'ob-card ' + dir}>
        <div className="ob-k">All set{v.name ? ', ' + v.name : ''}</div>
        <h1>Your workspace is ready.</h1>
        <p className="ob-s">Here’s the starting picture from your answers.</p>
        <div className="ob-sum">
          <div><small>Room after costs each month</small><b className={room < 0 ? 'neg' : ''}>{room < 0 ? '-' : ''}{money(Math.abs(room))}</b></div>
          <div><small>Saved so far</small><b>{money(num(v, 'saved') || 0)}</b></div>
          <div>
            <small>{v.goalName || 'Goal'} progress</small>
            <b>{pct}%</b>
            <div className="goal-track"><i style={{ width: pct + '%' }}></i></div>
          </div>
        </div>
        {room < 0 ? <p className="ob-warn">Your costs and savings plan are more than your income. You can adjust this in Financial profile.</p> : null}
        <div className="ob-act">
          <button className="button-quiet" onClick={back}>Back</button>
          <button className="button-dark" onClick={finish}>Open my workspace ↗</button>
        </div>
      </div>
    );
  } else {
    card = (
      <div key={'step' + i} ref={cardRef} className={'ob-card ' + dir}>
        <div className="ob-k">Step {i + 1} of {total}</div>
        <h1>{st.t}</h1>
        <p className="ob-s">{st.s}</p>
        {st.f.map((f) => (
          <div className="ob-f" key={f[0]}>
            <label htmlFor={'ob_' + f[0]}>{f[1]}</label>
            <input
              id={'ob_' + f[0]}
              type="text"
              inputMode={f[2] === 'number' ? 'decimal' : undefined}
              value={String(v[f[0]])}
              placeholder={f[3]}
              autoComplete="off"
              maxLength={40}
              onChange={(e) => {
                setV((s) => ({ ...s, [f[0]]: e.target.value }));
                setErr('');
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') next(); }}
            />
          </div>
        ))}
        {st.hint && sug() > 0 ? (
          <button className="ob-hint" onClick={() => { setV((s) => ({ ...s, goalTarget: sug() })); setDir(''); }}>
            Suggested target: {money(sug())} (three months of essentials and commitments). Use it
          </button>
        ) : null}
        <div className="ob-err" id="obErr" role="alert">{err}</div>
        <div className="ob-act">
          {i ? <button className="button-quiet" onClick={back}>Back</button> : <span></span>}
          <button className="button-dark" onClick={next}>Continue →</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={'ob' + (leaving ? ' out' : '')} role="dialog" aria-modal="true" aria-label="Set up FinWise">
      <div className="ob-top">
        <div className="ob-logo"><span className="brand-mark"></span><span>fin<b>wise</b></span></div>
        <div className="ob-bar"><i style={{ width: progress + '%' }}></i></div>
      </div>
      {card}
      <div ref={confettiRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}></div>
    </div>
  );
}
