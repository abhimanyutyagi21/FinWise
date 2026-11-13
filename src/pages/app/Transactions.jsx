import { useRef, useState } from 'react';
import { useUI } from '../../context/UIContext.jsx';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { TX_CATEGORIES, sumBy, todayIso } from '../../lib/finance.js';
import { EmptyState, Metric, PageHead } from '../../components/ui/Bits.jsx';

const blank = () => ({ type: 'expense', description: '', category: 'Food', amount: '', date: todayIso(), recurring: false });

export default function Transactions() {
  const { transactions, addTransaction, deleteTransaction, money, cur, sym } = useWorkspace();
  const { say } = useUI();
  const [form, setForm] = useState(blank);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const descRef = useRef(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const totalIn = sumBy(transactions.filter((t) => t.type === 'income'), (t) => t.amount);
  const totalOut = sumBy(transactions.filter((t) => t.type === 'expense'), (t) => t.amount);

  const q = search.toLowerCase();
  const rows = transactions
    .filter((t) => (filter === 'all' || t.type === filter) && (t.description + ' ' + t.category).toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date));

  const submit = async (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!(amount > 0)) return say('Enter an amount above zero.');
    const saved = await addTransaction({
      type: form.type,
      description: form.description.trim(),
      category: form.category,
      amount,
      date: form.date,
      recurring: !!form.recurring,
    });
    if (saved) {
      say('Transaction saved.');
      setForm(blank());
    }
  };

  const remove = async (id) => {
    if (await deleteTransaction(id)) say('Transaction removed.');
  };

  return (
    <>
      <PageHead
        kicker="EVERYDAY MONEY"
        title="Know where it goes."
        sub="Record income and expenses, search your history, and keep your cash flow grounded in real entries."
        action={<button className="button-dark" onClick={() => descRef.current?.focus()}>+ Add transaction</button>}
      />
      <div className="metrics-grid">
        <Metric label="Income recorded" value={totalIn} foot="All saved entries" icon="↗" />
        <Metric label="Expenses recorded" value={totalOut} foot="All saved entries" icon="↘" />
        <Metric label="Net movement" value={totalIn - totalOut} foot="Income minus expenses" icon="∑" />
        <Metric label="Entries" value={String(transactions.length)} foot="Saved in this browser" icon="▤" />
      </div>

      <section className="panel legacy-panel">
        <div className="panel-head"><div><h3>Add a transaction</h3><p>Amounts are in {cur.plural}.</p></div></div>
        <form className="legacy-form" onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="txType">Type</label>
            <select id="txType" value={form.type} onChange={set('type')}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="txDescription">Description</label>
            <input id="txDescription" ref={descRef} required maxLength={90} placeholder="e.g. Groceries or freelance payment" value={form.description} onChange={set('description')} />
          </div>
          <div className="form-field">
            <label htmlFor="txCategory">Category</label>
            <select id="txCategory" value={form.category} onChange={set('category')}>
              {TX_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="txAmount">Amount ({sym})</label>
            <input id="txAmount" type="number" step="any" min="0.01" max="100000000" required placeholder="0" value={form.amount} onChange={set('amount')} />
          </div>
          <div className="form-field">
            <label htmlFor="txDate">Date</label>
            <input id="txDate" type="date" required value={form.date} onChange={set('date')} />
          </div>
          <div className="form-field recurring-toggle">
            <label>
              <input id="txRecurring" type="checkbox" checked={form.recurring} onChange={(e) => setForm((f) => ({ ...f, recurring: e.target.checked }))} /> Repeat monthly
            </label>
            <small>Creates future monthly entries when you open FinWise.</small>
          </div>
          <button className="button-dark" type="submit">Save entry ↗</button>
        </form>
      </section>

      <section className="panel legacy-panel">
        <div className="panel-head">
          <div><h3>Transaction history</h3><p>Filter by type or search descriptions and categories.</p></div>
          <div className="legacy-controls">
            <select id="txFilter" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All entries</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>
            <input id="txSearch" placeholder="Search transactions" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div id="transactionRows">
          {!rows.length ? (
            <EmptyState title="No transactions yet."> Add your first entry above.</EmptyState>
          ) : (
            <div className="legacy-table-wrap">
              <table className="legacy-table">
                <thead><tr><th>Entry</th><th>Category</th><th>Date</th><th>Amount</th><th></th></tr></thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id}>
                      <td><b>{t.description}</b><small>{t.type === 'income' ? 'Income' : 'Expense'}</small></td>
                      <td>{t.category}</td>
                      <td>{t.date}</td>
                      <td className={t.type === 'income' ? 'positive' : 'negative'}>{t.type === 'income' ? '+' : '−'}{money(t.amount)}</td>
                      <td><button className="mini-action" onClick={() => remove(t.id)} aria-label={'Delete ' + t.description}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
