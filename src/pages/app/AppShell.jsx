import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { UIProvider, useUI } from '../../context/UIContext.jsx';
import { WorkspaceProvider, useWorkspace } from '../../context/WorkspaceContext.jsx';
import { api } from '../../lib/api.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import ProfileMenu from '../../components/ui/ProfileMenu.jsx';
import Onboarding from './Onboarding.jsx';
import Overview from './Overview.jsx';
import Scenario from './Scenario.jsx';
import Commitments from './Commitments.jsx';
import Goals from './Goals.jsx';
import Transactions from './Transactions.jsx';
import Budgets from './Budgets.jsx';
import Subscriptions from './Subscriptions.jsx';
import Analytics from './Analytics.jsx';
import AiAnalysis from './AiAnalysis.jsx';
import Profile from './Profile.jsx';
import Settings from './Settings.jsx';

const VIEWS = {
  overview: Overview,
  scenarios: Scenario,
  commitments: Commitments,
  goals: Goals,
  transactions: Transactions,
  budgets: Budgets,
  subscriptions: Subscriptions,
  analytics: Analytics,
  ai: AiAnalysis,
  profile: Profile,
  settings: Settings,
};

const CRUMBS = {
  overview: 'Overview', scenarios: 'Decision studio', commitments: 'Commitments', goals: 'Savings goals', transactions: 'Transactions',
  budgets: 'Budgets', subscriptions: 'Subscriptions', analytics: 'Analytics', ai: 'AI analysis', profile: 'Financial profile', settings: 'Settings',
};

const NAV = [
  ['overview', '◫', 'Overview'],
  ['scenarios', '⌁', 'Decision studio'],
  ['commitments', '↻', 'Commitments'],
  ['goals', '◎', 'Savings goals'],
  ['transactions', '▤', 'Transactions'],
  ['budgets', '◷', 'Budgets'],
  ['subscriptions', '↻', 'Recurring costs'],
  ['analytics', '▥', 'Analytics'],
  ['ai', '✦', 'AI analysis', 'NEW'],
];
const PREFS = [
  ['profile', '☷', 'Financial profile'],
  ['settings', '⚙', 'Settings'],
];

const MOBILE_MAX = 980;

function Shell() {
  const { view = 'overview' } = useParams();
  const current = VIEWS[view] ? view : 'overview';
  const View = VIEWS[current];
  const navigate = useNavigate();
  const { say, alert } = useUI();
  const { profile, onboarded, money } = useWorkspace();
  useDocumentTitle('FinWise — Decision Studio');

  const [navOpen, setNavOpen] = useState(false);
  const [menu, setMenu] = useState(null); // 'top' | 'side' | null
  const [ob, setOb] = useState(() => (!onboarded ? 'on' : null)); // 'on' | 'out' | null
  const [reveal, setReveal] = useState(false);
  const menuBtnRef = useRef(null);
  const topAvatarRef = useRef(null);
  const sideMenuRef = useRef(null);
  const wasNavOpen = useRef(false);

  const shownName = profile.name || 'Your workspace';
  const initial = (shownName.trim()[0] || 'F').toUpperCase();
  const closeMenu = useCallback(() => setMenu(null), []);

  // Page-level classes the stylesheet relies on.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('ob-pending', ob === 'on');
    document.body.classList.toggle('ob-on', ob === 'on');
    return () => {
      document.documentElement.classList.remove('ob-pending');
      document.body.classList.remove('ob-on');
    };
  }, [ob]);

  useEffect(() => {
    document.body.classList.remove('leaving');
    document.body.classList.toggle('nav-open', navOpen);
    if (navOpen) {
      setMenu(null);
      const t = setTimeout(() => (document.querySelector('.nav-item.active') || document.querySelector('.nav-item'))?.focus(), 80);
      wasNavOpen.current = true;
      return () => clearTimeout(t);
    }
    if (wasNavOpen.current && window.innerWidth <= MOBILE_MAX) menuBtnRef.current?.focus();
    wasNavOpen.current = false;
    return undefined;
  }, [navOpen]);

  useEffect(() => () => document.body.classList.remove('nav-open'), []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && navOpen && !document.querySelector('.dlg')) setNavOpen(false);
    };
    const mq = window.matchMedia('(min-width:981px)');
    const onMq = (e) => { if (e.matches) setNavOpen(false); };
    document.addEventListener('keydown', onKey);
    mq.addEventListener('change', onMq);
    return () => {
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
    };
  }, [navOpen]);

  const goTo = (v) => {
    navigate('/app/' + v);
    if (navOpen) {
      setNavOpen(false);
      window.scrollTo(0, 0);
    }
  };

  const toggleMenu = (which) => (e) => {
    e.stopPropagation();
    setMenu((m) => (m === which ? null : which));
  };

  const onGo = (saved) => {
    setOb('out');
    setReveal(true);
    setTimeout(() => { setOb(null); setReveal(false); }, 1000);
    setTimeout(() => say('Your ' + money(saved) + ' in savings is now in Savings goals.'), 700);
  };

  const anchor = menu === 'top' ? topAvatarRef.current : menu === 'side' ? sideMenuRef.current : null;

  return (
    <>
      <div id="appShell" className={'app-shell' + (reveal ? ' reveal' : '')}>
        <div className="nav-scrim" id="navScrim" onClick={() => setNavOpen(false)}></div>
        <aside className="sidebar" id="sidebar" aria-label="Main navigation">
          <button type="button" className="side-close" id="sideClose" aria-label="Close menu" onClick={() => setNavOpen(false)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <div className="side-brand"><span className="brand-mark"></span><span>fin<b>wise</b><small>DECISION STUDIO</small></span></div>
          <div className="side-profile">
            <div className="profile-avatar" id="profileAvatar">{initial}</div>
            <div><b id="profileName">{shownName}</b><small>Personal finances</small></div>
            <button ref={sideMenuRef} id="profileMenu" aria-label="Profile menu" aria-haspopup="menu" aria-expanded={menu === 'side'} onClick={toggleMenu('side')}>•••</button>
          </div>
          <div className="side-label">YOUR WORKSPACE</div>
          <nav className="side-nav">
            {NAV.map(([id, icon, label, badge]) => (
              <button key={id} className={'nav-item' + (current === id ? ' active' : '')} onClick={() => goTo(id)}>
                <span>{icon}</span> {label} {badge ? <i>{badge}</i> : null}
              </button>
            ))}
          </nav>
          <div className="side-label tools-label">PREFERENCES</div>
          <nav className="side-nav">
            {PREFS.map(([id, icon, label]) => (
              <button key={id} className={'nav-item' + (current === id ? ' active' : '')} onClick={() => goTo(id)}>
                <span>{icon}</span> {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="workspace">
          <header className="workspace-top">
            <div className="top-left">
              <button ref={menuBtnRef} type="button" className="menu-btn" id="menuBtn" aria-label={navOpen ? 'Close menu' : 'Open menu'} aria-expanded={navOpen} aria-controls="sidebar" onClick={() => setNavOpen((o) => !o)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
              </button>
              <div className="crumb"><span>FINWISE</span><b>/</b><strong id="crumbCurrent">{CRUMBS[current]}</strong></div>
            </div>
            <div className="top-actions">
              <span className="privacy-chip"><i></i> LIVE WORKSPACE</span>
              <button
                className="icon-btn"
                id="helpBtn"
                aria-label="Help"
                onClick={() => alert('How FinWise estimates work', 'FinWise compares illustrative scenarios using the numbers you enter. Check your inputs, read the assumptions shown with each result, and make the final decision yourself.')}
              >?</button>
              <button ref={topAvatarRef} type="button" className="top-avatar" id="topAvatar" aria-label="Account menu" aria-haspopup="menu" aria-expanded={menu === 'top'} title="Account" onClick={toggleMenu('top')}>{initial}</button>
            </div>
          </header>
          <div id="viewContent" className="view-content vin" key={current}>
            <View />
          </div>
          <footer className="workspace-footer">
            <span>FinWise · Make decisions with context.</span>
            <span>Illustrative estimates only · Not financial advice</span>
          </footer>
        </main>
      </div>

      {menu && anchor ? <ProfileMenu anchor={anchor} onClose={closeMenu} /> : null}
      {ob ? <Onboarding leaving={ob === 'out'} onGo={onGo} /> : null}
    </>
  );
}

/** /app/* : the signed-in workspace. Guards the session and provides workspace + UI state. */
export default function AppShell() {
  const navigate = useNavigate();

  // Any API call that comes back 401 (session ended) sends the user to the login page.
  useEffect(() => {
    const onExpired = () => navigate('/login', { replace: true });
    // A page restored from the back/forward cache after logout re-checks the session.
    const onShow = (e) => { if (e.persisted) api.get('/auth/me').catch(() => {}); };
    window.addEventListener('fw:unauthorized', onExpired);
    window.addEventListener('pageshow', onShow);
    return () => {
      window.removeEventListener('fw:unauthorized', onExpired);
      window.removeEventListener('pageshow', onShow);
    };
  }, [navigate]);

  return (
    <UIProvider>
      <WorkspaceProvider>
        <Routes>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path=":view" element={<Shell />} />
        </Routes>
      </WorkspaceProvider>
    </UIProvider>
  );
}
