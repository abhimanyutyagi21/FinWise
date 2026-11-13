import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useLandingMotion, useSmoothScroll } from '../hooks/useLandingEffects.js';
import { CountUp, Frame, RemoteImg, Reveal, Words } from '../components/landing/primitives.jsx';
import Preloader from '../components/landing/Preloader.jsx';
import Globe from '../components/landing/Globe.jsx';
import { Faq, Hub, ProductTabs, Simulator } from '../components/landing/Interactive.jsx';
import overviewImg from '../assets/overview.jpg';
import analyticsImg from '../assets/analytics.jpg';
import scenariosImg from '../assets/scenarios.jpg';
import { useEffect } from 'react';

const TICKER = ['Track every dollar', 'Budget with confidence', 'Hit savings goals faster', 'Kill forgotten subscriptions', 'Test decisions first', 'See the full picture'];
const UNSPLASH = (id, w) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const MOSAIC = [
  ['t', 'photo-1496181133206-80ce9b88a853', 'Big purchases', 'Laptop, car, sofa. See what it does to your month before you commit.'],
  ['wd', 'photo-1476514525535-07fb3b4ae5f1', 'Dream trips', 'Set the target, add what you can, and watch the countdown shrink.'],
  ['', 'photo-1497366754035-f200968a6e72', 'Calm planning', 'One clear view, every Sunday.'],
  ['', 'photo-1519681393784-d120267933ba', 'Safety nets', 'Build an emergency fund you can see growing.'],
];

const svgProps = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
const STEPS = [
  ['M4 12h16M12 4v16', 'Add your money', 'Enter income, bills and a few transactions. FinWise builds your picture as you go.'],
  ['M4 18V8m6 10V4m6 14v-7', 'See the full picture', 'Dashboards, budgets and charts light up from your own entries. No setup, no formulas.'],
  ['M5 13l4 4L19 7', 'Decide with confidence', 'Run a what-if in Decision Studio and know the impact before you spend a dollar.'],
];

const personaSvg = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const PERSONAS = [
  [
    <>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H18a1 1 0 0 1 1 1v1.5" />
      <path d="M3 8.5V17a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-8.5a1 1 0 0 0-1-1H5.5A2.5 2.5 0 0 1 3 8.5z" />
      <circle cx="16.2" cy="13.5" r="1.3" />
    </>,
    'First paycheck', 'The first-jobber', 'Just started earning and everything disappears by the 20th.',
    'FinWise splits income into essentials, savings and spending so the month stops being a surprise.',
  ],
  [
    <>
      <rect x="4.5" y="5" width="15" height="10.5" rx="1.8" />
      <path d="M2.5 19h19" />
      <path d="M10 10.2l1.6 1.6 2.8-3" />
    </>,
    'Side income', 'The freelancer', 'Income changes every month, so planning feels like guessing.',
    'Track irregular income, see a real savings rate, and test a slow month before it happens.',
  ],
  [
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.6" />
      <circle cx="12" cy="12" r="1.2" />
    </>,
    'Big goals', 'The planner', 'Saving for a home, a trip and a buffer all at once.',
    'Goal rings, timing estimates and Decision Studio keep every priority in the same picture.',
  ],
];

const COMPARE = [
  ['Income and expense tracking', 1, 1],
  ['Budgets with live progress', 0, 1],
  ['Savings goals and timing', 0, 0],
  ['Subscription cost summary', 0, 0],
  ['Plain-language insights', 0, 0],
  ['What-if decision simulation', 0, 0],
  ['One connected dashboard', 0, 0],
];
const Mark = ({ yes }) => <td><span className={yes ? 'y' : 'n'}>{yes ? '✓' : '–'}</span></td>;

const Rule = ({ n, a, b }) => (
  <div className="rule"><b>{n}</b><span>{a}</span><i></i><span>{b}</span></div>
);

export default function Landing() {
  useDocumentTitle('FinWise: see your money clearly and decide with confidence');
  const rootRef = useRef(null);
  const [nogl, setNogl] = useState(false);
  const [showLoader] = useState(true);

  useSmoothScroll();
  useLandingMotion(rootRef);

  // Body classes the preloader and reveal animations depend on.
  useEffect(() => {
    document.body.classList.add('pl-on');
    return () => document.body.classList.remove('pl-on', 'ready');
  }, []);
  const ready = () => document.body.classList.add('ready');

  return (
    <div ref={rootRef}>
      {showLoader ? <Preloader onDone={ready} /> : null}

      <header className="nav">
        <Link className="logo" to="/"><i></i><span>fin<b>wise</b></span></Link>
        <nav className="links"><a href="#product">Product</a><a href="#sim">Decision Studio</a><a href="#how">How it works</a><a href="#faq">FAQ</a></nav>
        <Link className="btn" to="/signup">Get started</Link>
      </header>

      <section className="hero dk">
        <div className="orb o1"></div>
        <div className="orb o2"></div>
        <div className="wrap">
          <div>
            <div className="lab">Personal finance, in one workspace</div>
            <h1><Words text="Take control of your money." /> <span className="s"><Words text="Build a better financial future." start={5} /></span></h1>
            <p>FinWise pulls every transaction, budget, subscription and savings goal into one live picture, then lets you stress-test your next big decision before you make it.</p>
            <div className="row">
              <Link className="btn bm" to="/signup">Open the workspace <span className="ar">→</span></Link>
              <a className="btn b2" href="#sim">Try the simulator</a>
            </div>
            <div className="trust"><span>Spending</span><span>Budgets</span><span>Goals</span><span>Subscriptions</span><span>Decisions</span></div>
          </div>
          <div className={'gw' + (nogl ? ' nogl' : '')} id="gw">
            <div className="halo"></div>
            <Globe onFail={() => setNogl(true)} />
            <div className="fc c1 tilt"><small>Net balance</small><CountUp to={124500} pre="$" /><span className="up">▲ up this month</span></div>
            <div className="fc c2 tilt"><small>Savings rate</small><CountUp to={31} suf="%" /><div className="mb"><i style={{ width: '31%' }}></i></div></div>
            <div className="fc c3 tilt"><small>Emergency fund</small><CountUp to={48} suf="%" /><div className="mb"><i style={{ width: '48%' }}></i></div></div>
            <div className="fc c4 tilt"><small>Safe to spend</small><CountUp to={18500} pre="$" /><span className="up">this month</span></div>
            <span className="hint">Drag to rotate · Interactive globe</span>
          </div>
        </div>
      </section>

      <div className="tk">
        <div className="tkt">
          {[0, 1].flatMap((r) => TICKER.map((t) => [<span key={r + t}>{t}</span>, <i key={r + t + 'i'}>✦</i>]))}
        </div>
      </div>

      <section className="sc" id="product">
        <Reveal className="wrap ctr">
          <div className="lab">01 / The workspace</div>
          <h2>One workspace. <span className="s">Every answer.</span></h2>
          <p className="sub">Your balance, budgets, goals and subscriptions finally speak to each other. Open it and know where you stand.</p>
        </Reveal>
        <div className="wrap st3d">
          <div className="fo f1 tilt"><small>Budget</small><b>Food · on track</b></div>
          <div className="fo f2 tilt"><small>Insight</small><b>Savings rate 70%</b></div>
          <div className="fo f3 tilt"><small>Goal</small><b>Emergency fund 48%</b></div>
          <Frame src={overviewImg} alt="FinWise overview view" big />
        </div>
      </section>

      <Rule n="02" a="Connected" b="Scattered becomes one picture" />
      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal className="panel-dk dk" id="workspace">
            <div>
              <div className="lab">From scattered to connected</div>
              <h2>Everything working <span className="s">beautifully together.</span></h2>
              <p>Transactions, budgets, goals and subscriptions feed the same overview, so one number never contradicts another.</p>
              <Link className="btn b1" to="/app">Open your workspace</Link>
            </div>
            <Hub />
          </Reveal>
        </div>
      </section>

      <Rule n="03" a="Product tour" b="Pick a tool, see it live" />
      <section id="features" style={{ padding: 0 }}>
        <ProductTabs />
      </section>

      <Rule n="04" a="Insights and decisions" b="Understand it, then act on it" />
      <section style={{ padding: 0 }}>
        <Reveal className="wrap zrow">
          <div className="zimg">
            <div className="fo f2"><small>Insight</small><b>Savings rate 70%</b></div>
            <Frame src={analyticsImg} alt="FinWise analytics" />
          </div>
          <div className="ztxt">
            <div className="lab">Analytics</div>
            <h2>Charts that <span className="s">explain themselves.</span></h2>
            <p>Plain-language summaries sit beside income vs expenses, category breakdowns and balance trends, all built from the transactions you record.</p>
            <ul className="ck">
              <li>Top category and biggest expense</li>
              <li>Savings rate and health check</li>
              <li>Subscriptions as monthly and yearly cost</li>
            </ul>
          </div>
        </Reveal>
        <div style={{ height: 110 }}></div>
        <Reveal className="wrap zrow rev">
          <div className="zimg">
            <div className="fo f1"><small>What if</small><b>New laptop · $180/mo</b></div>
            <Frame src={scenariosImg} alt="FinWise scenarios" />
          </div>
          <div className="ztxt">
            <div className="lab">Decision Studio</div>
            <h2>Test the decision <span className="s">before you make it.</span></h2>
            <p>Model a new payment against the room left in your month, then compare it with where you are today. Assumptions are always spelled out.</p>
            <ul className="ck">
              <li>Live room-after-payment result</li>
              <li>Share of monthly room used</li>
              <li>Save scenarios to revisit later</li>
            </ul>
          </div>
        </Reveal>
      </section>

      <Rule n="05" a="Capabilities" b="Everything money touches" />
      <section id="connected" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <h2>Everything money touches. <span className="s">Finally connected.</span></h2>
          <Reveal className="bento">
            <div className="card big">
              <div className="ic">◎</div>
              <h3>Budgets and goals that stay honest.</h3>
              <p>Set a limit per category and see actual spending, what is left and the share used. Add money to savings goals and watch progress move.</p>
              <div className="cmp">
                <div>Food <small style={{ float: 'right' }}>72% used</small><i style={{ width: '72%' }}></i></div>
                <div>Transport <small style={{ float: 'right' }}>41% used</small><i style={{ width: '41%', opacity: 0.7 }}></i></div>
                <div>Laptop fund <small style={{ float: 'right' }}>38% saved</small><i style={{ width: '38%', opacity: 0.5 }}></i></div>
              </div>
            </div>
            <div className="card sg">
              <div className="ic">↻</div>
              <div className="num" style={{ marginTop: 14 }}>Monthly</div>
              <h3>Subscriptions and recurring costs.</h3>
              <p>Weekly, monthly and yearly costs converted to one monthly figure.</p>
            </div>
            <div className="card">
              <div className="ic">▥</div>
              <h3>Reports that read plainly.</h3>
              <p>Income vs expenses, category spending and balance trend from your entries.</p>
            </div>
            <div className="card" style={{ gridColumn: 'span 2' }}>
              <div className="ic">⌁</div>
              <h3>Insights from your own data.</h3>
              <p>Top category, savings rate, budgets over limit and goal timing. Nothing is shown unless your entries support it.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <Rule n="06" a="How it works" b="Three steps to clarity" />
      <section id="how" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="ctr"><h2>From scattered to clear <span className="s">in three steps.</span></h2></div>
          <Reveal className="stps">
            {STEPS.map(([path, title, text]) => (
              <div className="stp" key={title}>
                <div className="sn"><svg {...svgProps}><path d={path} /></svg></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <Rule n="07" a="Decision Studio" b="Drag, don’t guess" />
      <section id="sim" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal className="sim dk"><Simulator /></Reveal>
        </div>
      </section>

      <Rule n="08" a="Made for real life" b="Every money moment" />
      <section style={{ padding: 0 }}>
        <div className="wrap">
          <Reveal className="mos">
            {MOSAIC.map(([cls, id, title, text]) => (
              <div className={'ph' + (cls ? ' ' + cls : '')} key={title}>
                <RemoteImg src={UNSPLASH(id, 1000)} alt={title} />
                <div><h3>{title}</h3><p>{text}</p></div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="band px dk">
        <RemoteImg src={UNSPLASH('photo-1470770841072-f978cf4d019e', 2200)} alt="" />
        <div className="bov"></div>
        <Reveal className="wrap bct">
          <div className="lab">Our belief</div>
          <h2>The point isn’t to control everything. <span className="s">It’s to see your options clearly.</span></h2>
          <Link className="btn bm" to="/signup">Start with your numbers <span className="ar">→</span></Link>
        </Reveal>
      </section>

      <Rule n="09" a="Who it’s built for" b="Three people, one workspace" />
      <section style={{ padding: 0 }}>
        <div className="wrap">
          <Reveal className="pes">
            {PERSONAS.map(([icon, lab, title, sit, help]) => (
              <div className="card pe" key={title}>
                <div className="av"><svg {...personaSvg}>{icon}</svg></div>
                <div className="lab" style={{ margin: '18px 0 6px' }}>{lab}</div>
                <h3>{title}</h3>
                <p className="sit">{sit}</p>
                <div className="hl2"><small>How FinWise helps</small><p>{help}</p></div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <Rule n="10" a="Why FinWise" b="More than a tracker" />
      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="ctr"><h2>More than a tracker. <span className="s">A decision engine.</span></h2></div>
          <Reveal className="cmpw">
            <table className="ct">
              <thead><tr><th></th><th>Spreadsheet</th><th>Basic expense app</th><th className="hl">FinWise</th></tr></thead>
              <tbody>
                {COMPARE.map(([row, sheet, app]) => (
                  <tr key={row}><td>{row}</td><Mark yes={sheet} /><Mark yes={app} /><Mark yes={1} /></tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      <Rule n="11" a="Questions" b="Clear answers" />
      <section id="faq" style={{ padding: 0 }}>
        <Reveal className="wrap faq">
          <div><h2>Good questions. <span className="s">Clear answers.</span></h2></div>
          <Faq />
        </Reveal>
      </section>

      <section style={{ padding: 0, marginTop: 120 }}>
        <div className="wrap">
          <Reveal className="cta card">
            <div className="lab">Your next chapter</div>
            <h2>See where your money goes. <span className="s">Decide what comes next.</span></h2>
            <p>Open your workspace and start with your own numbers.</p>
            <Link className="btn b1" to="/signup">Get started <span className="ar">→</span></Link>
          </Reveal>
        </div>
      </section>

      <footer className="foot dk">
        <div className="wrap">
          <div>
            <Link className="logo" to="/"><i></i><span>fin<b>wise</b></span></Link>
            <p style={{ marginTop: 14, fontSize: '.9rem' }}>Track, understand and plan your money in one place.</p>
          </div>
          <div><h4>Product</h4><a href="#product">Workspace</a><a href="#features">Features</a><a href="#sim">Decision Studio</a></div>
          <div><h4>Get started</h4><Link to="/signup">Sign up</Link><Link to="/login">Log in</Link><Link to="/app">Open the app</Link></div>
          <div><h4>Learn</h4><a href="#how">How it works</a><a href="#faq">FAQ</a></div>
        </div>
        <div className="copy">© 2026 FinWise. Estimates are illustrative and not financial advice.</div>
      </footer>
    </div>
  );
}
