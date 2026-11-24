import { FaHourglassHalf } from "react-icons/fa";
import "./ComingSoon.css";

export default function ComingSoon({ title, reason, features = [] }) {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-card">
        <div className="coming-soon-icon">
          <FaHourglassHalf />
        </div>
        <h2>{title || "Coming Soon"}</h2>
        {reason && <p className="coming-soon-reason">{reason}</p>}
        {features.length > 0 && (
          <div className="coming-soon-features">
            <p className="coming-soon-features-title">Planned features:</p>
            <ul>
              {features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
