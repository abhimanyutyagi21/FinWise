import { useState } from 'react';
import { useUI } from '../../context/UIContext.jsx';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { PageHead } from '../../components/ui/Bits.jsx';

const DEFAULTS = { name: 'New monthly payment', monthly: '', oneTime: '0', duration: '12', note: '' };

export default function Scenario() {
  const { available: a, money, sym, saveScenario } = useWorkspace();
  const { say } = useUI();
  const [f, setF] = useState(DEFAULTS);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const name = f.name.trim() || 'Untitled scenario';
  const monthly = Math.max(0, Number(f.monthly) || 0);
  const oneTime = Math.max(0, Number(f.oneTime) || 0);
  const duration = Number(f.duration) || 12;
  const after = a - monthly;
  const neg = after < 0;
  const signed = (neg ? '−' : '') + money(Math.abs(after));

  const save = async () => {
    if (await saveScenario({ name, monthly, oneTime, duration, note: f.note.trim() })) {
      say('Scenario saved to your workspace.');
      setF(DEFAULTS);
    }
  };

  return (
    <>
      <PageHead
        kicker="DECISION STUDIO"
        title="Try the choice on for size."
        sub="Model a purchase or recurring payment against your current monthly picture. Change the assumptions and compare the result."
      />
      <div className="decision-layout">
        <section className="panel form-panel">
          <h3>Set up a scenario</h3>
          <p>Use estimates that feel realistic to you. Nothing here is connected to a bank account.</p>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-field">
              <label htmlFor="scenarioName">What are you considering?</label>
              <input id="scenarioName" value={f.name} onChange={set('name')} maxLength={70} placeholder="e.g. New laptop" />
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="monthlyPayment">Monthly payment ({sym})</label>
                <input id="monthlyPayment" type="number" step="any" min="0" max="100000000" value={f.monthly} onChange={set('monthly')} placeholder="Enter a monthly payment" required />
              </div>
              <div className="form-field">
                <label htmlFor="oneTimeCost">One-time cost ({sym})</label>
                <input id="oneTimeCost" type="number" step="any" min="0" max="100000000" value={f.oneTime} onChange={set('oneTime')} />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="duration">How long will it last?</label>
              <select id="duration" value={f.duration} onChange={set('duration')}>
                {[3, 6, 12, 24, 36].map((m) => <option key={m} value={m}>{m} months</option>)}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="scenarioNote">Why does this matter to you? (optional)</label>
              <input id="scenarioNote" value={f.note} onChange={set('note')} maxLength={120} placeholder="e.g. Needed for my course" />
            </div>
            <div className="form-actions">
              <button className="button-dark" type="submit">Calculate impact <span>↗</span></button>
              <button className="button-quiet" type="button" onClick={() => setF(DEFAULTS)}>Reset</button>
            </div>
          </form>
        </section>

        <section className="panel result-panel" id="scenarioResult">
          <div className="panel-head">
            <div><h3>Your estimated impact</h3><p>Compared with your current monthly picture</p></div>
            <span className="metric-icon">⌁</span>
          </div>
          <div className="result-number">{signed}</div>
          <div className="result-caption">
            {neg ? 'This payment is larger than your current monthly room.' : 'Estimated room after costs, with this payment'}
          </div>
          <div className="result-stats">
            <div><span>Room before</span><b>{money(a)}</b></div>
            <div><span>New monthly payment</span><b>− {money(monthly)}</b></div>
            <div><span>Room after</span><b>{signed}</b></div>
            <div><span>Share of current room used</span><b>{a ? Math.round((monthly / a) * 100) + '%' : '—'}</b></div>
          </div>
          <div className="result-bar"><i style={{ width: Math.min(100, a ? (monthly / a) * 100 : 100) + '%' }}></i></div>
          <div className="result-explain">
            <b>{neg ? 'Pause and review the assumptions' : 'What this means'}</b>
            {neg
              ? `The proposed payment is ${money(Math.abs(after))} more than the room available in your current estimate. This does not automatically mean you cannot afford it, but it highlights a gap to investigate.`
              : `If your other monthly numbers stay the same, this choice leaves about ${money(after)} after listed costs and planned savings.`}{' '}
            {oneTime ? `The one-time cost of ${money(oneTime)} is separate and would reduce your available savings if paid from them.` : ''}{' '}
            The estimate excludes fees, interest, taxes, and unexpected costs unless included in your inputs.
          </div>
          <button className="button-dark" style={{ marginTop: 16 }} onClick={save}>Save this scenario <span>＋</span></button>
        </section>
      </div>

      <div className="comparison-grid">
        <article className="scenario-card">
          <span className="tag">CURRENT BASELINE</span>
          <h3>Keep things as they are</h3>
          <strong>{money(a)}</strong>
          <p>Estimated monthly room after listed costs and goals.</p>
        </article>
        <article className="scenario-card">
          <span className="tag">WITH THE NEW PAYMENT</span>
          <h3>{name}</h3>
          <strong>{signed}</strong>
          <p>{`${money(monthly)} per month · ${duration} months${oneTime ? ' · ' + money(oneTime) + ' upfront' : ''}`}</p>
        </article>
      </div>
    </>
  );
}
