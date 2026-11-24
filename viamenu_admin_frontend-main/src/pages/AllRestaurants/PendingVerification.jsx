import { useState } from "react";
import { FaClock, FaShieldAlt, FaEye } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import PageShell from "../../components/common/PageShell";
import StatsCard from "../../components/common/StatsCard";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import { useDataFetch, useDebounce } from "../../hooks/useDataFetch";
import { useSortState } from "../../hooks/useSortState";
import axiosInstance from "../../utils/axiosInstance";
import { restaurantColumn, ownerColumn, locationColumn, dateColumn } from "./restaurantColumns";

export default function PendingVerification() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState({});
  const search = useDebounce(searchInput);
  const sort = useSortState("restaurants-pending", "name", "asc");

  const params = { page, limit: 10, isVerified: "false", sortBy: sort.sortBy, sortOrder: sort.sortOrder, ...(search && { search }) };
  const { data: restaurants, loading, metadata, refetch } = useDataFetch("/admin/restaurant/all", "restaurants", params);

  const handleVerify = async (r) => {
    setActionLoading((p) => ({ ...p, [r.id]: true }));
    try {
      await axiosInstance.patch(`/admin/restaurant/${r.id}/verify`);
      toast.success(`${r.name} verified successfully`);
      refetch();
    } catch (e) {
      toast.error(e.response?.data?.message || "Verification failed");
    } finally {
      setActionLoading((p) => ({ ...p, [r.id]: false }));
    }
  };

  const columns = [
    restaurantColumn,
    ownerColumn,
    locationColumn,
    { key: "status", label: "Status", sort: "status", render: (v) => <StatusBadge status={v} /> },
    dateColumn("Joined"),
    {
      key: "actions",
      label: "Actions",
      render: (_v, r) => (
        <div className="act-row">
          <button className="act-btn act-btn--ghost" onClick={() => navigate(`/restaurants/restaurant-details/${r.id}`)} title="View">
            <FaEye />
          </button>
          <button className="act-btn act-btn--success" onClick={() => handleVerify(r)} title="Verify" disabled={actionLoading[r.id]}>
            {actionLoading[r.id] ? <span className="act-spin" /> : <MdVerified />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageShell
      title="Pending Verification"
      subtitle={`${metadata.total_records} restaurants awaiting verification`}
      stats={
        <>
          <StatsCard icon={FaClock}     label="Pending"      value={metadata.total_records} color="#f59e0b" />
          <StatsCard icon={FaShieldAlt} label="On This Page" value={restaurants.length}     color="#2c8769" />
        </>
      }
    >
      <FilterBar
        search={searchInput}
        onSearch={(v) => { setSearchInput(v); setPage(1); }}
        placeholder="Search by name, email, phone or ID…"
        onReset={() => { setSearchInput(""); sort.resetSort(); setPage(1); }}
      />
      <DataTable onRowClick={(r) => navigate(`/restaurants/restaurant-details/${r.id}`)} columns={columns} data={restaurants} loading={loading} sort={sort} emptyText="No restaurants pending verification" />
      <Pagination metadata={metadata} onPageChange={setPage} />
    </PageShell>
  );
}
