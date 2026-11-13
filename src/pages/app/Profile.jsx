import { useEffect, useState } from 'react';
import { useUI } from '../../context/UIContext.jsx';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { PageHead } from '../../components/ui/Bits.jsx';

const FIELDS = [
  ['income', 'Monthly take-home income'],
  ['essentials', 'Essential expenses'],
  ['commitments', 'Existing EMIs and commitments'],
  ['savings', 'Planned monthly goal savings'],
];

export default function Profile() {
  const { profile, updateProfile, money, sym, cur, available } = useWorkspace();
  const { say } = useUI();
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map(([k]) => [k, String(profile[k])])));

  // Keep the inputs in sync when amounts change elsewhere (e.g. a currency switch).
  useEffect(() => {
    setForm(Object.fromEntries(FIELDS.map(([k]) => [k, String(profile[k])])));
  }, [profile.income, profile.essentials, profile.commitments, profile.savings]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();
    if (await updateProfile(Object.fromEntries(FIELDS.map(([k]) => [k, Number(form[k]) || 0])))) say('Your monthly picture has been updated.');
  };
  const clear = async () => {
    if (await updateProfile({ income: 0, essentials: 0, commitments: 0, savings: 0 })) say('Values cleared.');
  };

  return (
    <>
      <PageHead
        kicker="YOUR FINANCIAL BASELINE"
        title="Start with your monthly reality."
        sub="Use take-home income and average monthly estimates. These numbers are used to calculate scenario comparisons."
      />
      <div className="profile-layout">
        <section className="panel form-panel">
          <h3>Monthly financial picture</h3>
          <p>All amounts are in {cur.plural}. Use the values that best reflect a typical month.</p>
          <form onSubmit={submit}>
            {FIELDS.map(([k, label]) => (
              <div className="form-field" key={k}>
                <label htmlFor={k}>{label} ({sym})</label>
                <input id={k} type="number" step="any" min="0" max="100000000" value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} required />
              </div>
            ))}
            <div className="form-actions">
              <button className="button-dark" type="submit">Save financial picture <span>↗</span></button>
              <button className="button-quiet" type="button" onClick={clear}>Clear values</button>
            </div>
          </form>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div><h3>Monthly room, at a glance</h3><p>Calculated from the figures on this page</p></div>
            <span className="metric-icon">∑</span>
          </div>
          <div className="result-number" id="profileAvailable">{money(available)}</div>
          <div className="result-caption">Estimated available after costs and planned savings</div>
          <div className="cash-summary">
            <div><span>Income</span><b>{money(profile.income)}</b></div>
            <div><span>Essentials + commitments</span><b>{money(profile.essentials + profile.commitments)}</b></div>
            <div><span>Planned savings</span><b>{money(profile.savings)}</b></div>
            <div><span>Available</span><b className="positive">{money(available)}</b></div>
          </div>
          <div className="result-explain">
            <b>A note on estimates</b>
            FinWise uses only the numbers you enter and does not connect to financial institutions. If expenses exceed income, update your baseline and consider getting qualified financial guidance for high-stakes decisions.
          </div>
        </section>
      </div>
    </>
  );
}
