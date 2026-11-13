import { useState } from 'react';
import { useUI } from '../../context/UIContext.jsx';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { BUDGET_CATEGORIES, budgetProgress } from '../../lib/finance.js';
import { EmptyState, PageHead } from '../../components/ui/Bits.jsx';

export default function Budgets() {
  const { budgets, transactions, saveBudget, removeBudget, money, sym } = useWorkspace();
  const { say } = useUI();
  const [category, setCategory] = useState('Food');
  const [limit, setLimit] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const value = Number(limit);
    if (!(value > 0)) return say('Enter a budget above zero.');
    if (await saveBudget(category, value)) {
      setLimit('');
      say('Budget saved.');
    }
  };

  return (
    <>
      <PageHead kicker="SPENDING LIMITS" title="Give every category a boundary." sub="Set monthly spending limits and compare them with the expenses you record." />
      <section className="panel legacy-panel">
        <div className="panel-head">
          <div><h3>Create a monthly budget</h3><p>Spending is calculated from expense transactions in the matching category for the current month.</p></div>
        </div>
        <form className="legacy-form" onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="budgetCategory">Category</label>
            <select id="budgetCategory" value={category} onChange={(e) => setCategory(e.target.value)}>
              {BUDGET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="budgetLimit">Monthly limit ({sym})</label>
            <input id="budgetLimit" type="number" step="any" min="0.01" required placeholder="e.g. 8000" value={limit} onChange={(e) => setLimit(e.target.value)} />
          </div>
          <button className="button-dark" type="submit">Save budget ↗</button>
        </form>
      </section>

      <section className="panel legacy-panel">
        <div className="panel-head"><div><h3>Your budgets</h3><p>Progress updates when you add or remove transactions.</p></div></div>
        <div className="budget-list">
          {budgets.length ? (
            budgets.map((b) => {
              const { spent, pct } = budgetProgress(b, transactions);
              return (
                <div className="budget-item" key={b.category}>
                  <div className="budget-line"><b>{b.category}</b><span>{money(spent)} / {money(b.limit)}</span></div>
                  <div className="budget-track">
                    <i style={{ width: pct + '%', background: pct >= 100 ? '#8a5a2b' : pct >= 80 ? '#b08a3e' : '#0a9a3e' }}></i>
                  </div>
                  <div className="budget-line muted-line">
                    <small>{pct}% used{spent > b.limit ? ' · Over budget by ' + money(spent - b.limit) : ' · ' + money(Math.max(0, b.limit - spent)) + ' left'}</small>
                    <button className="mini-action" onClick={async () => { if (await removeBudget(b.category)) say('Budget removed.'); }}>Remove</button>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState title="No budgets set."> Create one to track category spending.</EmptyState>
          )}
        </div>
      </section>
    </>
  );
}
