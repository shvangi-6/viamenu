import { FaTimes } from "react-icons/fa";
import "./Modal.css";

/** Shared dialog for the newer admin pages. Own class names (mdl-*), so page CSS can't leak in. */
export default function Modal({ title, onClose, children, footer, wide }) {
  return (
    <div className="mdl-overlay" onClick={onClose}>
      <div className={`mdl-box${wide ? " mdl-box--wide" : ""}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="mdl-head">
          <h3 className="mdl-title">{title}</h3>
          <button className="mdl-x" onClick={onClose} aria-label="Close"><FaTimes /></button>
        </div>
        <div className="mdl-body">{children}</div>
        {footer && <div className="mdl-foot">{footer}</div>}
      </div>
    </div>
  );
}
