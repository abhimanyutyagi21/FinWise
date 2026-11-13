import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { EmptyState } from '../ui/Bits.jsx';

const W = 600, H = 220, L = 42, R = 15, T = 16, B = 40;

export function BarChart({ labels, values, label = 'Financial data chart', colors }) {
  const { money, short } = useWorkspace();
  if (!values.length) return <EmptyState title="Not enough data yet.">Add transactions to build this chart.</EmptyState>;
  const innerW = W - L - R;
  const innerH = H - T - B;
  const max = Math.max(1, ...values.map((v) => Math.abs(v)));
  const step = innerW / values.length;
  const bw = Math.min(38, step * 0.52);
  return (
    <svg className="data-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = T + innerH * f;
        return (
          <g key={f}>
            <line x1={L} y1={y} x2={W - R} y2={y} stroke="#e9e8df" strokeDasharray="3 5" />
            <text x={L - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#92958a">{short(max * (1 - f))}</text>
          </g>
        );
      })}
      {values.map((v, i) => {
        const h = (Math.abs(v) / max) * innerH;
        const y = T + innerH - h;
        const x = L + i * step + (step - bw) / 2;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={Math.max(2, h)} rx="4" fill={colors?.[i] || '#2fb865'}>
              <title>{labels[i]}: {money(v)}</title>
            </rect>
            <text x={L + i * step + step / 2} y={H - 15} textAnchor="middle" fontSize="10" fill="#777b70">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function LineChart({ labels, values }) {
  const { money } = useWorkspace();
  if (values.length < 2) return <EmptyState title="Need more transaction history.">Add transactions on different dates or months to see a trend.</EmptyState>;
  const iw = W - L - R;
  const ih = H - T - B;
  const max = Math.max(1, ...values.map((v) => Math.abs(v)));
  const min = Math.min(0, ...values);
  const range = Math.max(1, max - min);
  const pts = values.map((v, i) => [L + (iw * i) / Math.max(1, values.length - 1), T + ih - ((v - min) / range) * ih]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
  return (
    <svg className="data-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Savings balance trend">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = T + ih * f;
        return <line key={f} x1={L} y1={y} x2={W - R} y2={y} stroke="#e9e8df" strokeDasharray="3 5" />;
      })}
      <path d={d} fill="none" stroke="#0a9a3e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="#fffefa" stroke="#0a9a3e" strokeWidth="2">
          <title>{labels[i]}: {money(values[i])}</title>
        </circle>
      ))}
      {labels.map((x, i) => (
        <text key={i} x={pts[i][0]} y={H - 15} textAnchor="middle" fontSize="10" fill="#777b70">{x}</text>
      ))}
    </svg>
  );
}

const DONUT_COLORS = ['#0a9a3e', '#7fc99a', '#a9dfb4', '#5c7164', '#3f8a5c', '#c9d8b8', '#d8c9a0', '#9bb59f'];

export function Donut({ entries }) {
  const { money, short } = useWorkspace();
  if (!entries.length) return <EmptyState title="No expense data yet.">Add expenses to see category patterns.</EmptyState>;
  const total = entries.reduce((a, x) => a + x[1], 0) || 1;
  let offset = 0;
  const segs = entries.map(([name, val], i) => {
    const pct = (val / total) * 100;
    const el = (
      <circle
        key={name}
        cx="80" cy="80" r="53" fill="none"
        stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
        strokeWidth="22"
        strokeDasharray={`${pct * 3.33} ${333 - pct * 3.33}`}
        strokeDashoffset={-offset * 3.33}
        transform="rotate(-90 80 80)"
      >
        <title>{name}: {money(val)}</title>
      </circle>
    );
    offset += pct;
    return el;
  });
  return (
    <div className="donut-layout">
      <svg viewBox="0 0 160 160" role="img" aria-label="Spending by category">
        {segs}
        <text x="80" y="76" textAnchor="middle" fontSize="10" fill="#85897d">TOTAL SPENT</text>
        <text x="80" y="94" textAnchor="middle" fontSize="13" fontWeight="700" fill="#2b3337">{short(total)}</text>
      </svg>
      <div className="donut-legend">
        {entries.map(([n, v], i) => (
          <div key={n}>
            <i style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}></i>
            <span>{n}</span>
            <b>{Math.round((v / total) * 100)}%</b>
          </div>
        ))}
      </div>
    </div>
  );
}
