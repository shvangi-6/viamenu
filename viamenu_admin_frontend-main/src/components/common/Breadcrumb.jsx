import { useNavigate } from "react-router-dom";
import "./shared.css";

export default function Breadcrumb({ crumbs }) {
  const navigate = useNavigate();

  return (
    <nav className="bc-wrap">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {i > 0 && <span className="bc-sep">/</span>}
            {isLast ? (
              <span className="bc-current">{crumb.label}</span>
            ) : (
              <button className="bc-link" onClick={() => navigate(crumb.to)}>
                {crumb.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
