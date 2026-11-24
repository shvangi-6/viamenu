import "./shared.css";

export default function PageShell({ title, subtitle, actions, stats, children }) {
  return (
    <div className="ps-page">
      <div className="ps-header">
        <div>
          <h1 className="ps-title">{title}</h1>
          {subtitle && <p className="ps-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="ps-actions">{actions}</div>}
      </div>
      {stats && <div className="ps-stats">{stats}</div>}
      <div className="ps-content">{children}</div>
    </div>
  );
}
