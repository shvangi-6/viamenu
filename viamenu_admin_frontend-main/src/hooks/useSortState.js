import { useEffect, useState } from "react";

/**
 * Column sort for list pages that survives navigation and reloads, so a list
 * comes back sorted the way the admin left it. Stored per page under `key`.
 */
export function useSortState(key, defaultBy = "createdAt", defaultOrder = "desc") {
  const storageKey = `sort:${key}`;
  const [sort, setSort] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      // a sort saved under an older default (e.g. newest first before A→Z, T1485) is dropped
      if (saved?.sortBy && saved.defaultBy === defaultBy) return saved;
    } catch {
      // storage blocked or unreadable — fall back to the default order
    }
    return { sortBy: defaultBy, sortOrder: defaultOrder };
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ ...sort, defaultBy }));
    } catch {
      // not persisting is fine; the sort still applies for this visit
    }
  }, [storageKey, sort, defaultBy]);

  const toggleSort = (col) =>
    setSort((prev) =>
      prev.sortBy === col
        ? { sortBy: col, sortOrder: prev.sortOrder === "asc" ? "desc" : "asc" }
        : { sortBy: col, sortOrder: "asc" }
    );

  const resetSort = () => setSort({ sortBy: defaultBy, sortOrder: defaultOrder });

  return { sortBy: sort.sortBy, sortOrder: sort.sortOrder, toggleSort, resetSort };
}
