import { useState } from 'react';
import { useUI } from '../../context/UIContext.jsx';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { SUB_CATEGORIES, monthlyEquivalent, sumBy } from '../../lib/finance.js';
import { EmptyState, Metric, PageHead } from '../../components/ui/Bits.jsx';

const blank = { name: '', category: 'Entertainment', amount: '', cycle: 'monthly' };

export default function Subscriptions() {
  const { subscriptions, addSubscription, removeSubscription, available, money, sym } = useWorkspace();
  const { say } = useUI();
  const [form, setForm] = useState(blank);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const total = sumBy(subscriptions, monthlyEquivalent);

  const submit = async (e) => {
    e.preventDefault();
    if (await addSubscription({ name: form.name.trim(), category: form.category, amount: Number(form.amount), cycle: form.cycle })) {
      setForm(blank);
      say('Recurring cost added.');
    }
  };

  return (
    <>
      <PageHead kicker="RECURRING COSTS" title="Keep recurring costs in sight." sub="Track subscriptions, memberships, and bills that repeat each month." />
      <div className="metrics-grid">
        <Metric label="Monthly total" value={total} foot="Estimated recurring spend" icon="↻" />
        <Metric label="Annual estimate" value={total * 12} foot="If every plan stays active" icon="∑" />
        <Metric label="Active items" value={String(subscriptions.length)} foot="Recurring items tracked" icon="▤" />
        <Metric label="Monthly room" value={available - total} foot="After your baseline and recurring items" icon="◎" />
      </div>

      <section className="panel legacy-panel">
        <div className="panel-head"><div><h3>Add a recurring cost</h3><p>Track the amount you expect to pay each billing cycle.</p></div></div>
        <form className="legacy-form" onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="subName">Name</label>
            <input id="subName" required maxLength={80} placeholder="e.g. Music subscription" value={form.name} onChange={set('name')} />
          </div>
          <div className="form-field">
            <label htmlFor="subCategory">Category</label>
            <select id="subCategory" value={form.category} onChange={set('category')}>
              {SUB_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="subAmount">Amount ({sym})</label>
            <input id="subAmount" type="number" step="any" min="0.01" required placeholder="0" value={form.amount} onChange={set('amount')} />
          </div>
          <div className="form-field">
            <label htmlFor="subCycle">Billing cycle</label>
            <select id="subCycle" value={form.cycle} onChange={set('cycle')}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <button className="button-dark" type="submit">Add recurring cost ↗</button>
        </form>
      </section>

      <section className="panel legacy-panel">
        <div className="panel-head"><div><h3>Recurring items</h3><p>Monthly equivalent is used for the totals above.</p></div></div>
        {subscriptions.length ? (
          <div className="legacy-table-wrap">
            <table className="legacy-table">
              <thead><tr><th>Name</th><th>Category</th><th>Cycle</th><th>Amount</th><th>Monthly equivalent</th><th></th></tr></thead>
              <tbody>
                {subscriptions.map((x) => (
                  <tr key={x.id}>
                    <td><b>{x.name}</b></td>
                    <td>{x.category}</td>
                    <td>{x.cycle}</td>
                    <td>{money(x.amount)}</td>
                    <td>{money(monthlyEquivalent(x))}</td>
                    <td><button className="mini-action" onClick={async () => { if (await removeSubscription(x.id)) say('Recurring cost removed.'); }}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No recurring costs added."> Add a subscription or bill above.</EmptyState>
        )}
      </section>
    </>
  );
}
