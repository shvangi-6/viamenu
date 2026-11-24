import { useRef } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import "./shared.css";

/** The one search + filters + Reset row used by every list page. Omit onSearch for lists with nothing to search. */
export default function FilterBar({ search, onSearch, filters = [], onReset, placeholder = "Search…", children }) {
  const inputRef = useRef(null);

  return (
    <div className="fb-bar">
      {onSearch && (
      <div className="fb-search-wrap">
        <FaSearch className="fb-search-icon" />
        <input
          ref={inputRef}
          className="fb-search"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        {search && (
          <FaTimes
            className="fb-clear"
            onClick={() => { onSearch(""); inputRef.current?.focus(); }}
          />
        )}
      </div>
      )}

      {filters.map((f) => (
        <select
          key={f.key}
          className="fb-select"
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
        >
          <option value="">{f.placeholder || f.key}</option>
          {f.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {children}

      {onReset && (
        <button className="fb-reset" onClick={onReset}>
          <FaTimes /> Reset
        </button>
      )}
    </div>
  );
}
