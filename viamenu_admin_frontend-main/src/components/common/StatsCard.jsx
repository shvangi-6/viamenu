import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import "./StatsCard.css";

function TrendBadge({ trend }) {
  if (!trend) return null;
  if (trend.value == null) {
    return <span className="stats-card__trend stats-card__trend--new">New</span>;
  }
  const isUp = trend.direction === "up";
  return (
    <span className={`stats-card__trend ${isUp ? "stats-card__trend--up" : "stats-card__trend--down"}`}>
      {isUp ? <FaArrowUp /> : <FaArrowDown />}
      {trend.value}%
    </span>
  );
}

export default function StatsCard({ icon: Icon, label, value, color = "#2c8769", sub, trend, onClick }) {
  return (
    <div
      className={`stats-card${onClick ? " stats-card--clickable" : ""}`}
      style={{ "--sc-color": color }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}
    >
      <div className="stats-card__top">
        <div className="stats-card__heading">
          <span className="stats-card__label">{label}</span>
          {sub && <span className="stats-card__sub">{sub}</span>}
        </div>
        <div className="stats-card__icon">
          <Icon />
        </div>
      </div>
      <div className="stats-card__value-row">
        <span className="stats-card__value">{value ?? 0}</span>
        <TrendBadge trend={trend} />
      </div>
    </div>
  );
}
