import { useWorkspace } from '../../context/WorkspaceContext.jsx';

export function PageHead({ kicker, title, sub, action }) {
  return (
    <div className="page-head">
      <div>
        <div className="page-eyebrow">{kicker}</div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      {action}
    </div>
  );
}

/** Numbers are formatted as money; pass a string for counts or percentages. */
export function Metric({ label, value, foot, icon }) {
  const { money } = useWorkspace();
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-value">{typeof value === 'number' ? money(value) : value}</div>
      <div className="metric-foot">{foot}</div>
    </article>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty-state">
      <b>{title}</b>
      {children}
    </div>
  );
}

export function FormField({ label, htmlFor, children }) {
  return (
    <div className="form-field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}
