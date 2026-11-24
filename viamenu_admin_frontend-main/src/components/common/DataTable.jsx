import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import "./shared.css";
import { rowClick } from "../../utils/rowClick";

/** Clickable column header. Also used by the hand-built tables on some pages. */
export function SortHeader({ label, field, sort }) {
  const active = sort.sortBy === field;
  const Icon = !active ? FaSort : sort.sortOrder === "asc" ? FaSortUp : FaSortDown;
  return (
    <span className="dt-th-sortable" onClick={() => sort.toggleSort(field)}>
      {label}
      <Icon style={{ fontSize: 10, opacity: active ? 1 : 0.6 }} />
    </span>
  );
}

/**
 * `sort` is the object returned by useSortState; a column becomes sortable by
 * naming the backend field in `col.sort`.
 */
export default function DataTable({ columns, data, loading, onRowClick, emptyText = "No records found", minWidth, sort, className = "" }) {
  if (loading) {
    return (
      <div className="dt-loading">
        <div className="dt-spinner" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="dt-empty">
        <div className="dt-empty-icon">📭</div>
        <div>{emptyText}</div>
      </div>
    );
  }

  return (
    <div className={`dt-wrap ${className}`}>
      <table className="dt-table" style={minWidth ? { minWidth, width: "auto" } : undefined}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.key === "actions" ? "dt-col-actions" : undefined} style={col.width ? { width: col.width, minWidth: col.width } : {}}>
                {sort && col.sort ? <SortHeader label={col.label} field={col.sort} sort={sort} /> : col.label}
              </th>
            ))}
            {onRowClick && <th style={{ width: 36 }} />}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id || i}
              className={onRowClick ? "dt-row--clickable" : ""}
              onClick={onRowClick ? rowClick(() => onRowClick(row)) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className={col.key === "actions" ? "dt-col-actions" : undefined}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                </td>
              ))}
              {onRowClick && (
                <td>
                  <span className="row-arrow">›</span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
