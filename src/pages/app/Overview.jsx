import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { monthlyNet } from '../../lib/finance.js';
import { BarChart } from '../../components/charts/Charts.jsx';
import { EmptyState, Metric, PageHead } from '../../components/ui/Bits.jsx';

function greeting(name) {
  const h = new Date().getHours();
  const p = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const n = String(name || '').trim().split(/\s+/)[0];
  return n ? p + ', ' + n : p;
}

export default function Overview() {
  const { profile, goals, scenarios, transactions, available: a, recurringTotal, money } = useWorkspace();
  const navigate = useNavigate();
  const go = (v) => () => navigate('/app/' + v);
  const commit = profile.commitments + profile.essentials + recurringTotal;
  const net = monthlyNet(transactions);

  return (
    <>
      <PageHead
        kicker="A CLEARER VIEW OF YOUR MONEY"
        title={greeting(profile.name) + '.'}
        sub="Here’s your current monthly picture. Adjust the numbers whenever your circumstances change."
        action={<button className="button-dark" onClick={go('scenarios')}>Test a decision <span>↗</span></button>}
      />
      <div className="metrics-grid">
        <Metric label="Monthly take-home" value={profile.income} foot="Your income after tax" icon="↗" />
        <Metric label="Regular outgoings" value={commit} foot="Essentials + commitments" icon="↘" />
        <Metric label="Goal contributions" value={profile.savings} foot="Planned each month" icon="◎" />
        <Metric label="Room after costs" value={a} foot={<strong>Available for flexible choices</strong>} icon="✳" />
      </div>
      <div className="overview-grid">
        <section className="panel">
          <div className="panel-head">
            <div><h3>Your financial rhythm</h3><p>Income minus expenses per month, from your transactions</p></div>
            <span className="select-small">6 MONTH VIEW</span>
          </div>
          <div className="chart-wrap"><BarChart labels={net.labels} values={net.values} label="Monthly net cash flow" /></div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div><h3>Monthly breakdown</h3><p>Where your income is allocated</p></div>
            <button className="button-quiet" onClick={go('profile')}>Edit numbers</button>
          </div>
          <div className="cash-summary">
            <div><span>Take-home income</span><b>{money(profile.income)}</b></div>
            <div><span>Essentials</span><b>{money(profile.essentials)}</b></div>
            <div><span>Existing commitments</span><b>{money(profile.commitments)}</b></div>
            <div><span>Tracked recurring costs</span><b>{money(recurringTotal)}</b></div>
            <div><span>Goal savings</span><b>{money(profile.savings)}</b></div>
            <div><span>Available after costs</span><b className="positive">{money(a)}</b></div>
          </div>
        </section>
      </div>
      <div className="overview-grid">
        <section className="panel">
          <div className="panel-head">
            <div><h3>Savings goals</h3><p>Keep future-you in the picture</p></div>
            <button className="button-quiet" onClick={go('goals')}>View goals ↗</button>
          </div>
          {goals.slice(0, 2).map((g, i) => {
            const pct = Math.min(100, (g.saved / g.target) * 100);
            return (
              <div className="goal-row" key={i}>
                <div className="goal-ring" style={{ background: `conic-gradient(#0a9a3e 0 ${pct}%,#e6eedd ${pct}%)` }}>
                  <b>{Math.round((g.saved / g.target) * 100)}%</b>
                </div>
                <div className="goal-detail">
                  <b>{g.name}</b>
                  <p>{money(g.saved)} saved of {money(g.target)}</p>
                  <div className="goal-amount">{money(Math.max(0, g.target - g.saved))} to go</div>
                </div>
              </div>
            );
          })}
        </section>
        <section className="panel">
          <div className="panel-head">
            <div><h3>Recent decisions</h3><p>Scenarios you've explored</p></div>
            <button className="button-quiet" onClick={go('scenarios')}>Open studio ↗</button>
          </div>
          {scenarios.length ? (
            scenarios.slice(-3).reverse().map((s, i) => (
              <div className="settings-row" key={i}>
                <div><b>{s.name}</b><p>{money(s.monthly)} monthly · {s.date || 'Just now'}</p></div>
                <b>{money(Math.max(0, a - s.monthly))}</b>
              </div>
            ))
          ) : (
            <EmptyState title="Your first what-if starts here.">Explore a purchase or monthly payment to see the estimated impact.</EmptyState>
          )}
        </section>
      </div>
      <section className="insight-panel">
        <div className="insight-icon">✳</div>
        <div>
          <b>A useful question to ask before committing</b>
          <p>After this payment, will I still have enough room for essentials, the unexpected, and the goals that matter to me?</p>
          <button onClick={go('scenarios')}>Explore a decision ↗</button>
        </div>
      </section>
    </>
  );
}
