function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportTransactionsCsv({ transactions, currency }) {
  const q = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const rows = [
    ['Type', 'Description', 'Category', 'Amount (' + currency + ')', 'Date'],
    ...transactions.map((t) => [t.type, t.description, t.category, t.amount, t.date]),
  ];
  download(new Blob([rows.map((r) => r.map(q).join(',')).join('\n')], { type: 'text/csv' }), 'finwise-transactions.csv');
}

export function exportWorkspaceJson({ currency, profile, transactions, budgets, subscriptions, goals, scenarios }) {
  const data = { exportedAt: new Date().toISOString(), currency, profile, transactions, budgets, subscriptions, goals, scenarios };
  download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'finwise-data-backup.json');
}
