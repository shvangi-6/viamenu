import { useState } from "react";
import { FaExclamationTriangle, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import PageShell from "../../components/common/PageShell";
import StatsCard from "../../components/common/StatsCard";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import { useDataFetch, useDebounce } from "../../hooks/useDataFetch";
import { useSortState } from "../../hooks/useSortState";
import { restaurantColumn, ownerColumn, locationColumn, dateColumn } from "./restaurantColumns";

export default function NoMenuRestaurants() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounce(searchInput);
  const sort = useSortState("restaurants-no-menu", "name", "asc");

  const params = { page, limit: 10, sortBy: sort.sortBy, sortOrder: sort.sortOrder, ...(search && { search }) };
  const { data: restaurants, loading, metadata } = useDataFetch("/admin/moderation/incomplete", "restaurants", params);

  const columns = [
    restaurantColumn,
    ownerColumn,
    {
      key: "issues",
      label: "Issues",
      render: (issues) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {(issues || []).map((issue) => (
            <StatusBadge key={issue} status="blocked" label={issue} />
          ))}
        </div>
      ),
    },
    locationColumn,
    dateColumn("Created"),
    {
      key: "actions",
      label: "Actions",
      render: (_v, r) => (
        <div className="act-row">
          <button className="act-btn act-btn--ghost" onClick={() => navigate(`/restaurants/restaurant-details/${r.id}`)} title="View">
            <FaEye />
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageShell
      title="No Menu Setup"
      subtitle="Restaurants with missing or incomplete setup"
      stats={<StatsCard icon={FaExclamationTriangle} label="Incomplete" value={metadata.total_records} color="#ef4444" />}
    >
      <FilterBar
        search={searchInput}
        onSearch={(v) => { setSearchInput(v); setPage(1); }}
        placeholder="Search restaurants by name…"
        onReset={() => { setSearchInput(""); sort.resetSort(); setPage(1); }}
      />
      <DataTable onRowClick={(r) => navigate(`/restaurants/restaurant-details/${r.id}`)} columns={columns} data={restaurants} loading={loading} sort={sort} emptyText="All restaurants are set up correctly" />
      <Pagination metadata={metadata} onPageChange={setPage} />
    </PageShell>
  );
}
