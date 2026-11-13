import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { buildAnalytics, savingsHealth } from '../../lib/finance.js';
import { BarChart, Donut, LineChart } from '../../components/charts/Charts.jsx';
import { Metric, PageHead } from '../../components/ui/Bits.jsx';

export default function Analytics() {
  const { transactions, budgets, subscriptions, goals, money } = useWorkspace();
  const a = buildAnalytics({ transactions, budgets, subscriptions, goals });
  const { inc, exp, allInc, allExp, sorted, biggest, budgetOver, months, labels, net, monthTotals, sortedTx, balanceVals, rate, monthlySub, goal, goalMonths } = a;

  const summary = transactions.length
    ? `This month you recorded ${money(inc)} income and ${money(exp)} expenses, leaving ${money(inc - exp)} net. ${
        sorted[0] ? `Your highest spending category is ${sorted[0][0]} at ${money(sorted[0][1])}.` : ''
      } ${
        rate >= 20
          ? 'Your recorded savings rate is holding above 20%.'
          : rate >= 0
            ? 'Your recorded savings rate is positive but worth watching.'
            : 'Your recorded expenses are higher than income this month.'
      }`
    : 'Add your transactions to generate a monthly summary.';

  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <>
      <PageHead
        kicker="YOUR MONEY, SUMMARISED"
        title="See the patterns behind your money."
        sub="Charts and insights built from the transactions you record, updated the moment you add one."
      />
      <div className="metrics-grid">
        <Metric label="Income this month" value={inc} foot="Recorded income entries" icon="↗" />
        <Metric label="Expenses this month" value={exp} foot="Recorded expense entries" icon="↘" />
        <Metric label="Net this month" value={inc - exp} foot="Income minus expenses" icon="∑" />
        <Metric label="Savings rate" value={inc ? rate + '%' : '—'} foot={inc ? 'Based on this month’s entries' : 'Add income to calculate'} icon="◎" />
      </div>

      <section className="panel legacy-panel">
        <div className="panel-head">
          <div><h3>Monthly summary</h3><p>Plain-language readout of the current month.</p></div>
          <span className="select-small">{monthName}</span>
        </div>
        <p className="analytics-summary">{summary}</p>
      </section>

      <div className="insight-cards">
        <article className="insight-mini">
          <small>Top spending category</small>
          <b>{sorted.length ? sorted[0][0] : 'Not available'}</b>
          <span>{sorted.length ? money(sorted[0][1]) + ' this month' : 'Add expense entries'}</span>
        </article>
        <article className="insight-mini">
          <small>Biggest recorded expense</small>
          <b>{biggest ? biggest.description : 'Not available'}</b>
          <span>{biggest ? money(biggest.amount) + ' · ' + biggest.date : 'Add expense entries'}</span>
        </article>
        <article className="insight-mini">
          <small>Savings health</small>
          <b>{savingsHealth(inc, rate)}</b>
          <span>{inc ? rate + '% recorded savings rate' : 'Calculated from current-month entries'}</span>
        </article>
        <article className="insight-mini">
          <small>Budget warning</small>
          <b>{budgetOver.length ? budgetOver.length + ' over limit' : budgets.length ? 'Budgets on track' : 'No budgets set'}</b>
          <span>{budgetOver.length ? budgetOver.map((b) => b.category).join(', ') : budgets.length ? 'Based on this month’s expenses' : 'Create a budget to track limits'}</span>
        </article>
        <article className="insight-mini">
          <small>Goal prediction</small>
          <b>{goalMonths !== null ? goalMonths + ' months' : 'Not enough data'}</b>
          <span>{goalMonths !== null ? 'Estimate for ' + goal.name + ' if this month’s net repeats' : 'Needs a goal and positive monthly net'}</span>
        </article>
        <article className="insight-mini">
          <small>Recurring costs</small>
          <b>{money(monthlySub)}/mo</b>
          <span>{subscriptions.length} tracked items · {money(monthlySub * 12)} yearly estimate</span>
        </article>
      </div>

      <div className="overview-grid analytics-charts">
        <section className="panel">
          <div className="panel-head"><div><h3>Income vs expenses</h3><p>Monthly totals from recorded entries.</p></div></div>
          <BarChart
            labels={labels.flatMap((x) => [x + ' In', x + ' Out'])}
            values={months.flatMap((m) => [monthTotals[m].income, monthTotals[m].expense])}
            label="Monthly income and expenses"
          />
        </section>
        <section className="panel">
          <div className="panel-head"><div><h3>Savings movement</h3><p>Monthly income minus expenses.</p></div></div>
          <BarChart labels={labels} values={net} label="Monthly net savings" />
        </section>
        <section className="panel">
          <div className="panel-head"><div><h3>Spending by category</h3><p>Current month, expense entries only.</p></div></div>
          <Donut entries={sorted} />
        </section>
        <section className="panel">
          <div className="panel-head"><div><h3>Balance trend</h3><p>Running total of recorded transactions, oldest to newest.</p></div></div>
          <LineChart labels={sortedTx.slice(-12).map((t) => String(t.date || '').slice(5))} values={balanceVals.slice(-12)} />
        </section>
      </div>

      <section className="panel legacy-panel">
        <div className="panel-head">
          <div><h3>All-time recorded totals</h3><p>Useful for checking the full transaction history separately from this month.</p></div>
        </div>
        <div className="cash-summary">
          <div><span>All-time income</span><b>{money(allInc)}</b></div>
          <div><span>All-time expenses</span><b>{money(allExp)}</b></div>
          <div><span>Net recorded movement</span><b className={allInc - allExp >= 0 ? 'positive' : 'negative'}>{money(allInc - allExp)}</b></div>
          <div><span>Recurring costs, monthly equivalent</span><b>{money(monthlySub)}</b></div>
        </div>
      </section>
    </>
  );
}
