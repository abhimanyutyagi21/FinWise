/* Pure calculation helpers. No React, no DOM, no storage. */

export const TX_CATEGORIES = ['Food', 'Transport', 'Housing', 'Shopping', 'Health', 'Education', 'Entertainment', 'Salary', 'Freelance', 'Other'];
export const BUDGET_CATEGORIES = ['Food', 'Transport', 'Housing', 'Shopping', 'Health', 'Education', 'Entertainment', 'Other'];
export const SUB_CATEGORIES = ['Entertainment', 'Software', 'Utilities', 'Membership', 'Other'];

export const sumBy = (list, fn) => list.reduce((a, x) => a + fn(x), 0);
export const todayIso = () => new Date().toISOString().slice(0, 10);
export const thisMonthKey = () => new Date().toISOString().slice(0, 7);
export const monthLabel = (key) => new Date(key + '-01T12:00:00').toLocaleDateString('en-US', { month: 'short' });

export function monthlyEquivalent(x) {
  const n = Number(x.amount) || 0;
  const c = String(x.cycle || 'monthly').toLowerCase();
  return c === 'yearly' ? n / 12 : c === 'weekly' ? (n * 52) / 12 : n;
}

export const recurringMonthlyTotal = (subscriptions) => sumBy(subscriptions, monthlyEquivalent);

export const availableRoom = (profile, subscriptions) =>
  profile.income - profile.essentials - profile.commitments - profile.savings - recurringMonthlyTotal(subscriptions);

/** Net cash flow for each of the last 6 months that have transactions. */
export function monthlyNet(transactions) {
  const m = {};
  transactions.forEach((t) => {
    const k = String(t.date).slice(0, 7);
    m[k] = (m[k] || 0) + (t.type === 'income' ? t.amount : -t.amount);
  });
  const keys = Object.keys(m).sort().slice(-6);
  return { labels: keys.map(monthLabel), values: keys.map((k) => m[k]) };
}

export function budgetProgress(budget, transactions) {
  const mk = thisMonthKey();
  const spent = sumBy(
    transactions.filter((t) => t.type === 'expense' && t.category === budget.category && t.date.slice(0, 7) === mk),
    (t) => t.amount,
  );
  const pct = Math.min(100, Math.round((spent / budget.limit) * 100));
  return { spent, pct };
}

/** Everything the Analytics page needs. */
export function buildAnalytics({ transactions, budgets, subscriptions, goals }) {
  const monthKey = thisMonthKey();
  const current = transactions.filter((t) => String(t.date || '').slice(0, 7) === monthKey);
  const inc = sumBy(current.filter((t) => t.type === 'income'), (t) => t.amount);
  const exp = sumBy(current.filter((t) => t.type === 'expense'), (t) => t.amount);
  const allInc = sumBy(transactions.filter((t) => t.type === 'income'), (t) => t.amount);
  const allExp = sumBy(transactions.filter((t) => t.type === 'expense'), (t) => t.amount);

  const cats = {};
  current.filter((t) => t.type === 'expense').forEach((t) => { cats[t.category] = (cats[t.category] || 0) + t.amount; });
  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);

  const biggest = transactions.filter((t) => t.type === 'expense').sort((a, b) => b.amount - a.amount)[0];
  const budgetOver = budgets.filter(
    (b) => sumBy(current.filter((t) => t.type === 'expense' && t.category === b.category), (t) => t.amount) > b.limit,
  );

  const monthTotals = {};
  transactions.forEach((t) => {
    const k = String(t.date || '').slice(0, 7);
    if (!k) return;
    if (!monthTotals[k]) monthTotals[k] = { income: 0, expense: 0 };
    monthTotals[k][t.type === 'income' ? 'income' : 'expense'] += t.amount;
  });
  const months = Object.keys(monthTotals).sort().slice(-6);
  const labels = months.map(monthLabel);
  const net = months.map((m) => monthTotals[m].income - monthTotals[m].expense);

  let running = 0;
  const sortedTx = transactions.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const balanceVals = sortedTx.map((t) => (running += t.type === 'income' ? t.amount : -t.amount));

  const rate = inc ? Math.round(((inc - exp) / inc) * 100) : 0;
  const monthlySub = recurringMonthlyTotal(subscriptions);
  const goal = goals.find((g) => g.target > g.saved);
  const monthlySavings = inc - exp;
  const goalMonths = goal && monthlySavings > 0 ? Math.ceil((goal.target - goal.saved) / monthlySavings) : null;

  return {
    inc, exp, allInc, allExp, sorted, biggest, budgetOver, months, labels, net, monthTotals,
    sortedTx, balanceVals, rate, monthlySub, goal, goalMonths,
  };
}

export function savingsHealth(inc, rate) {
  if (!inc) return 'Need income data';
  if (rate >= 40) return 'Excellent';
  if (rate >= 20) return 'Good';
  if (rate >= 10) return 'Average';
  if (rate >= 0) return 'Needs improvement';
  return 'Spending exceeds income';
}

/** Payload sent to the AI backend. Contains no transaction descriptions. */
export function buildAiPayload({ profile, transactions, budgets, goals, subscriptions, currency }, q = '') {
  const mk = thisMonthKey();
  const cur = transactions.filter((t) => String(t.date || '').slice(0, 7) === mk);
  const sum = (a, ty) => sumBy(a.filter((t) => t.type === ty), (t) => t.amount);
  const cats = {};
  cur.filter((t) => t.type === 'expense').forEach((t) => { cats[t.category] = (cats[t.category] || 0) + t.amount; });
  const mo = {};
  transactions.forEach((t) => {
    const k = String(t.date || '').slice(0, 7);
    if (!k) return;
    mo[k] = mo[k] || { income: 0, expense: 0 };
    mo[k][t.type] += t.amount;
  });
  return {
    app: 'FinWise',
    currency,
    question: q || '',
    generatedAt: new Date().toISOString(),
    profile: {
      monthlyIncome: profile.income,
      essentials: profile.essentials,
      fixedCommitments: profile.commitments,
      plannedSavings: profile.savings,
    },
    thisMonth: {
      month: mk,
      income: sum(cur, 'income'),
      expenses: sum(cur, 'expense'),
      net: sum(cur, 'income') - sum(cur, 'expense'),
      spendingByCategory: cats,
    },
    monthlyHistory: Object.keys(mo).sort().slice(-6).map((k) => ({ month: k, income: mo[k].income, expenses: mo[k].expense })),
    budgets: budgets.map((b) => ({ category: b.category, limit: b.limit, spentThisMonth: cats[b.category] || 0 })),
    goals: goals.map((g) => ({ name: g.name, target: g.target, saved: g.saved })),
    subscriptions: subscriptions.map((s) => ({ name: s.name, amount: s.amount, billingCycle: s.cycle })),
    recentTransactions: transactions.slice(-25).map((t) => ({ type: t.type, category: t.category, amount: t.amount, date: t.date })),
  };
}

export function buildAiSnapshot(data) {
  const p = buildAiPayload(data, '');
  const m = p.thisMonth;
  const cats = Object.entries(m.spendingByCategory).sort((a, b) => b[1] - a[1]);
  const over = p.budgets.filter((b) => b.limit > 0 && b.spentThisMonth > b.limit).length;
  return {
    rate: m.income > 0 ? Math.round(((m.income - m.expenses) / m.income) * 100) + '%' : 'No income yet',
    top: cats[0] ? cats[0][0] : 'No spending yet',
    topAmount: cats[0] ? cats[0][1] : null,
    over,
    subs: recurringMonthlyTotal(data.subscriptions),
  };
}
