import { useUI } from '../../context/UIContext.jsx';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useAccountActions } from '../../hooks/useAccountActions.js';
import { CURRENCIES } from '../../lib/currency.js';
import { exportTransactionsCsv, exportWorkspaceJson } from '../../lib/exporters.js';
import { PageHead } from '../../components/ui/Bits.jsx';

export default function Settings() {
  const ws = useWorkspace();
  const { confirm, say } = useUI();
  const { changeName, changeCurrency, logOut } = useAccountActions();

  const reset = async () => {
    const ok = await confirm(
      'Clear your workspace?',
      'This deletes your profile, transactions, budgets, goals and subscriptions from this browser, then takes you back to setup. This cannot be undone.',
      { danger: true, confirmText: 'Clear and start over' },
    );
    if (ok) ws.resetWorkspace();
  };

  return (
    <>
      <PageHead kicker="PREFERENCES" title="Your workspace, your way." sub="Manage your workspace data and understand what FinWise does with the numbers you enter." />
      <section className="panel" style={{ marginBottom: 15 }}>
        <div className="panel-head"><div><h3>Account and preferences</h3><p>Your name, currency and session</p></div></div>
        <div className="settings-row">
          <div><b>Display name</b><p>{ws.profile.name || 'Not set'} · used to greet you</p></div>
          <button className="button-quiet" onClick={changeName}>Change name</button>
        </div>
        <div className="settings-row">
          <div><b>Currency</b><p id="curHint">{ws.rateHint}</p></div>
          <select className="cur-select" value={ws.currency} disabled={ws.fxBusy} onChange={(e) => changeCurrency(e.target.value)} aria-label="Currency">
            {Object.keys(CURRENCIES).map((k) => (
              <option key={k} value={k}>{k} · {CURRENCIES[k].name} ({CURRENCIES[k].symbol})</option>
            ))}
          </select>
        </div>
        <div className="settings-row">
          <div><b>Log out</b><p>Your data stays saved on this device.</p></div>
          <button className="button-quiet" onClick={logOut}>Log out</button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><div><h3>Privacy and data</h3><p>How FinWise handles your information</p></div></div>
        <div className="settings-row">
          <div><b>Workspace data</b><p>Your financial profile, goals, entries and saved scenarios are stored in this browser.</p></div>
          <span className="pill-status">On this device</span>
        </div>
        <div className="settings-row">
          <div><b>Bank connections</b><p>FinWise does not connect to your bank or fetch transactions.</p></div>
          <span className="pill-status">Not connected</span>
        </div>
        <div className="settings-row">
          <div><b>AI analysis</b><p>AI analysis explains your recorded figures in plain language. It gives estimates, not financial advice.</p></div>
          <span className="pill-status">Optional</span>
        </div>
        <div className="settings-row">
          <div><b>Export your data</b><p>Download your profile, transactions, budgets, recurring costs, goals, and scenarios as a JSON backup.</p></div>
          <button className="button-quiet" onClick={() => { exportWorkspaceJson(ws); say('Your JSON backup has been downloaded.'); }}>Export JSON</button>{' '}
          <button className="button-quiet" onClick={() => { exportTransactionsCsv(ws); say('Transactions exported as CSV.'); }}>Export CSV</button>
        </div>
        <div className="settings-row">
          <div><b>Reset workspace</b><p>Remove your saved profile, goals and entries from this browser and start setup again.</p></div>
          <button className="button-quiet" onClick={reset}>Reset workspace</button>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 15 }}>
        <h3>About FinWise</h3>
        <p style={{ fontSize: '.88rem', lineHeight: 1.75, color: 'var(--sage)', marginTop: 8 }}>
          FinWise is a financial decision-support platform for students and young professionals. It helps people explore how purchases and recurring commitments may affect cash flow and goals. It is not a bank, investment advisor, or substitute for professional financial advice.
        </p>
      </section>
    </>
  );
}
