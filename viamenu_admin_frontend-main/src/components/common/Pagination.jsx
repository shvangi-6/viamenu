import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./Pagination.css";

// Footer of every list: "Showing x–y of z" on the left, page buttons on the
// right (only when there is more than one page).
export default function Pagination({ metadata, onPageChange }) {
  const { current_page, total_page, total_records, per_page } = metadata;

  if (!total_records) return null;

  const from = (current_page - 1) * per_page + 1;
  const to = Math.min(current_page * per_page, total_records);

  const getPages = () => {
    const pages = [];
    const delta = 2;
    const left = Math.max(2, current_page - delta);
    const right = Math.min(total_page - 1, current_page + delta);

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < total_page - 1) pages.push("...");
    if (total_page > 1) pages.push(total_page);
    return pages;
  };

  return (
    <div className="pg-footer">
      <span className="pg-summary">Showing {from}–{to} of {total_records}</span>
      {total_page > 1 && (
        <div className="pg-pages">
          <button
            className="pg-btn"
            onClick={() => onPageChange(current_page - 1)}
            disabled={current_page === 1}
          >
            <FaChevronLeft />
          </button>

          {getPages().map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="pg-ellipsis">…</span>
            ) : (
              <button
                key={p}
                className={`pg-btn ${current_page === p ? "pg-btn--active" : ""}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            )
          )}

          <button
            className="pg-btn"
            onClick={() => onPageChange(current_page + 1)}
            disabled={current_page === total_page}
          >
            <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
