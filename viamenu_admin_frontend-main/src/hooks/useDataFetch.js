import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../utils/axiosInstance";

/**
 * Generic data-fetch hook for admin list pages.
 *
 * @param {string} endpoint  - API path, e.g. "/admin/content/menus"
 * @param {string} dataKey   - Key to pick from response.data.data, e.g. "menus"
 * @param {object} params    - Query params (page, limit, search, filters …)
 * @param {object} options   - { initialData: [], enabled: true }
 */
export function useDataFetch(endpoint, dataKey, params = {}, options = {}) {
  const { initialData = [], enabled = true } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 10,
    total_page: 1,
  });
  const [error, setError] = useState(null);
  // Whole response payload, for extras some lists send next to the rows (stats, totals, summary).
  const [raw, setRaw] = useState(null);

  // Stable ref to avoid stale closure in effect
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetch = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get(endpoint, { params: paramsRef.current });
      if (res.data.statusCode === 200 && res.data.data) {
        setData(res.data.data[dataKey] ?? []);
        setRaw(res.data.data);
        setMetadata({
          total_records: res.data.data.total_records ?? 0,
          current_page: res.data.data.current_page ?? 1,
          per_page: res.data.data.per_page ?? 10,
          total_page: res.data.data.total_page ?? 1,
        });
      } else {
        setData([]);
      }
    } catch (err) {
      setError(err);
      if (err.response?.status !== 404) {
        toast.error(err.response?.data?.message || `Failed to fetch data from ${endpoint}`);
      }
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, dataKey, enabled]);

  // Re-run whenever any param changes (shallow comparison via JSON)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetch(); }, [JSON.stringify(params), enabled]);

  return { data, loading, metadata, error, raw, refetch: fetch };
}

/**
 * Debounce helper hook for search inputs.
 */
export function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
