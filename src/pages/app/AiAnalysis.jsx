import { useEffect, useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { analyze, checkAiHealth } from '../../services/ai.js';
import { buildAiPayload, buildAiSnapshot } from '../../lib/finance.js';
import { EmptyState, Metric, PageHead } from '../../components/ui/Bits.jsx';

const QUESTIONS = [
  'Explain my spending this month',
  'Where can I cut costs?',
  'Am I on track for my goals?',
  'Review my budgets',
  'Which subscriptions should I check?',
];

export default function AiAnalysis() {
  const ws = useWorkspace();
  const { money, usd } = ws;
  const [connected, setConnected] = useState(false);
  const [q, setQ] = useState('');
  const [chip, setChip] = useState(null);
  const [showPayload, setShowPayload] = useState(false);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState({ kind: 'idle' }); // idle | loading | notConnected | error | empty | ok

  useEffect(() => {
    let alive = true;
    checkAiHealth().then((ok) => { if (alive) setConnected(ok); });
    return () => { alive = false; };
  }, []);

  const snap = buildAiSnapshot(ws);
  const payload = () => buildAiPayload(ws, q.trim());

  const run = async () => {
    if (!connected) {
      setOut({ kind: 'notConnected' });
      return;
    }
    setBusy(true);
    setOut({ kind: 'loading' });
    try {
      const r = await analyze(payload());
      const insights = (r.insights || []).map((i) => (typeof i === 'string' ? { title: '', detail: i } : i));
      const recs = r.recommendations || [];
      const summary = r.summary || r.answer || '';
      setOut(summary || insights.length || recs.length ? { kind: 'ok', summary, insights, recs } : { kind: 'empty' });
    } catch (e) {
      setOut({ kind: 'error', message: e.message || 'Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead kicker="AI ANALYSIS" title="Ask your numbers anything." sub="FinWise reads the figures you have recorded and explains what they mean in plain language." />
      <div className="metrics-grid">
        <Metric label="Savings rate" value={snap.rate} foot="This month, from your entries" icon="◎" />
        <Metric label="Top spending" value={snap.top} foot={snap.topAmount != null ? money(snap.topAmount) + ' this month' : 'Add expenses to see this'} icon="↘" />
        <Metric label="Budgets over limit" value={String(snap.over)} foot={snap.over ? 'Worth a closer look' : 'All budgets within limit'} icon="◷" />
        <Metric label="Subscriptions" value={money(snap.subs) + '/mo'} foot="Converted to a monthly cost" icon="↻" />
      </div>

      <div className="decision-layout">
        <section className="panel form-panel">
          <div className="panel-head">
            <div><h3>Ask FinWise</h3><p>Pick a question or write your own.</p></div>
            <span id="aiPill" className={'pill-status' + (connected ? '' : ' pending')}>{connected ? 'Connected' : 'Not connected'}</span>
          </div>
          <div className="ai-chips">
            {QUESTIONS.map((x) => (
              <button key={x} className={'ai-chip' + (chip === x ? ' on' : '')} onClick={() => { setChip(x); setQ(x); }}>{x}</button>
            ))}
          </div>
          <div className="form-field">
            <label htmlFor="aiQ">Your question</label>
            <input id="aiQ" maxLength={300} placeholder={`e.g. Can I afford a ${money(usd(900))} laptop this quarter?`} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="button-dark" onClick={run} disabled={busy}>Analyze my finances ↗</button>
            <button className="button-quiet" type="button" onClick={() => setShowPayload((s) => !s)}>What gets sent?</button>
          </div>
          {showPayload ? <pre id="aiPayload" className="ai-pre">{JSON.stringify(payload(), null, 2)}</pre> : null}
        </section>

        <section className="panel">
          <div className="panel-head"><div><h3>AI response</h3><p>Based on the data you have recorded.</p></div></div>
          <div id="aiResult" aria-live="polite">
            {out.kind === 'idle' && <EmptyState title="Ready when you are.">Choose a question and press Analyze.</EmptyState>}
            {out.kind === 'notConnected' && (
              <EmptyState title="AI analysis activates once the Gemini service is connected.">Your figures are ready to send. Nothing has left this page.</EmptyState>
            )}
            {out.kind === 'loading' && <div className="ai-sk"><i></i><i></i><i></i><i></i></div>}
            {out.kind === 'error' && <EmptyState title="Analysis unavailable right now.">{out.message}</EmptyState>}
            {out.kind === 'empty' && <EmptyState title="No analysis returned.">Try a more specific question.</EmptyState>}
            {out.kind === 'ok' && (
              <>
                {out.summary ? <p className="ai-sum">{out.summary}</p> : null}
                {out.insights.length ? (
                  <div className="ai-ins">
                    {out.insights.map((i, k) => (
                      <div key={k}>{i.title ? <b>{i.title}</b> : null}<span>{i.detail || ''}</span></div>
                    ))}
                  </div>
                ) : null}
                {out.recs.length ? <ul className="ai-rec">{out.recs.map((x, k) => <li key={k}>{x}</li>)}</ul> : null}
                <p className="ai-note">AI-generated explanation based on your recorded figures. Estimates only, not financial advice.</p>
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
