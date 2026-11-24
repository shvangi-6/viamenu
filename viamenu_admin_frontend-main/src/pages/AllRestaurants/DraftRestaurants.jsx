import { useState } from "react";
import { FaEdit, FaEye, FaToggleOn } from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import PageShell from "../../components/common/PageShell";
import StatsCard from "../../components/common/StatsCard";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import { useDataFetch, useDebounce } from "../../hooks/useDataFetch";
import { useSortState } from "../../hooks/useSortState";
import axiosInstance from "../../utils/axiosInstance";
import { restaurantColumn, ownerColumn, locationColumn, countColumn, dateColumn } from "./restaurantColumns";

export default function DraftRestaurants() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState({});
  const search = useDebounce(searchInput);
  const sort = useSortState("restaurants-draft", "name", "asc");

  const params = { page, limit: 10, status: "DRAFT", sortBy: sort.sortBy, sortOrder: sort.sortOrder, ...(search && { search }) };
  const { data: restaurants, loading, metadata, refetch } = useDataFetch("/admin/restaurant/all", "restaurants", params);

  const handlePublish = async (r) => {
    setActionLoading((p) => ({ ...p, [r.id]: true }));
    try {
      await axiosInstance.patch(`/admin/restaurant/${r.id}/status`, { status: "PUBLISH" });
      toast.success(`${r.name} published`);
      refetch();
    } catch (e) {
      toast.error(e.response?.data?.message || "Cannot publish — ensure restaurant has a published menu with dishes");
    } finally {
      setActionLoading((p) => ({ ...p, [r.id]: false }));
    }
  };

  const columns = [
    restaurantColumn,
    ownerColumn,
    locationColumn,
    countColumn("menuCount", "Menus", "menuCount"),
    dateColumn("Created"),
    {
      key: "actions",
      label: "Actions",
      render: (_v, r) => (
        <div className="act-row">
          <button className="act-btn act-btn--ghost" onClick={() => navigate(`/restaurants/restaurant-details/${r.id}`)} title="View">
            <FaEye />
          </button>
          <button className="act-btn act-btn--success" onClick={() => handlePublish(r)} title="Publish" disabled={actionLoading[r.id]}>
            {actionLoading[r.id] ? <span className="act-spin" /> : <FaToggleOn />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageShell
      title="Draft Restaurants"
      subtitle={`${metadata.total_records} restaurants in draft status`}
      stats={<StatsCard icon={FaEdit} label="Draft" value={metadata.total_records} color="#f59e0b" />}
    >
      <FilterBar
        search={searchInput}
        onSearch={(v) => { setSearchInput(v); setPage(1); }}
        placeholder="Search by name, email, phone or ID…"
        onReset={() => { setSearchInput(""); sort.resetSort(); setPage(1); }}
      />
      <DataTable onRowClick={(r) => navigate(`/restaurants/restaurant-details/${r.id}`)} columns={columns} data={restaurants} loading={loading} sort={sort} emptyText="No draft restaurants found" />
      <Pagination metadata={metadata} onPageChange={setPage} />
    </PageShell>
  );
}
