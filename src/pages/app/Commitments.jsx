import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { Metric, PageHead } from '../../components/ui/Bits.jsx';

export default function Commitments() {
  const { profile, money } = useWorkspace();
  const navigate = useNavigate();
  const toProfile = () => navigate('/app/profile');
  const allocated = profile.income ? Math.round(((profile.essentials + profile.commitments + profile.savings) / profile.income) * 100) + '%' : '—';

  return (
    <>
      <PageHead
        kicker="RECURRING OUTGOINGS"
        title="Know what’s already spoken for."
        sub="Keep track of regular costs so new decisions start from a more realistic baseline."
        action={<button className="button-dark" onClick={toProfile}>Update monthly totals ↗</button>}
      />
      <div className="metrics-grid">
        <Metric label="Essentials" value={profile.essentials} foot="Housing, food, transport" icon="⌂" />
        <Metric label="Existing commitments" value={profile.commitments} foot="EMIs and recurring costs" icon="↻" />
        <Metric label="Together" value={profile.essentials + profile.commitments} foot="Already allocated monthly" icon="∑" />
        <Metric label="Income allocated" value={allocated} foot="Including planned savings" icon="◴" />
      </div>
      <section className="panel">
        <div className="panel-head">
          <div><h3>Your recurring picture</h3><p>Update the totals in your financial profile whenever they change.</p></div>
          <button className="button-dark" onClick={toProfile}>Edit profile ↗</button>
        </div>
        <div className="table-head"><span>Category</span><span>Monthly total</span><span>Type</span><span>Review</span></div>
        {[
          ['⌂', 'Essentials', 'Housing, food, transport, bills', profile.essentials, 'Core costs'],
          ['↻', 'Existing commitments', 'EMIs and recurring subscriptions', profile.commitments, 'Recurring'],
          ['◎', 'Goal savings', 'Planned monthly contribution', profile.savings, 'Future goals'],
        ].map(([icon, name, sub, amount, type]) => (
          <div className="table-row" key={name}>
            <span className="item-name"><i className="item-icon">{icon}</i>{name}<span className="subtext">{sub}</span></span>
            <b>{money(amount)}</b>
            <span>{type}</span>
            <span className="pill-status">Included</span>
          </div>
        ))}
      </section>
      <section className="insight-panel" style={{ marginTop: 16 }}>
        <div className="insight-icon">✳</div>
        <div>
          <b>Why this matters</b>
          <p>Scenario estimates are only as useful as the baseline. Check that these totals reflect your usual month before relying on comparisons.</p>
        </div>
      </section>
    </>
  );
}
