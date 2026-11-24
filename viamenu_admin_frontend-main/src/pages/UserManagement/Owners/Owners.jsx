import { useState } from "react";
import { FaUserTie, FaStore, FaBan, FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import PageShell from "../../../components/common/PageShell";
import StatsCard from "../../../components/common/StatsCard";
import FilterBar from "../../../components/common/FilterBar";
import DataTable from "../../../components/common/DataTable";
import StatusBadge from "../../../components/common/StatusBadge";
import Pagination from "../../../components/common/Pagination";
import { useDataFetch, useDebounce } from "../../../hooks/useDataFetch";
import { useSortState } from "../../../hooks/useSortState";
import axiosInstance from "../../../utils/axiosInstance";
import { fmtDate } from "../../../utils/fmtDate";
import { countColumn } from "../../AllRestaurants/restaurantColumns";
import { userColumn } from "../userColumns";

export default function Owners() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [blockedFilter, setBlockedFilter] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState({});
  const search = useDebounce(searchInput);
  const sort = useSortState("users-owners");

  const params = {
    page, limit: 10, sortBy: sort.sortBy, sortOrder: sort.sortOrder,
    ...(search && { search }), ...(blockedFilter && { isBlocked: blockedFilter }),
  };
  const { data: owners, loading, metadata, refetch } = useDataFetch("/admin/users/owners", "owners", params);

  const handleToggleBlock = async (user) => {
    const newBlocked = !user.isBlocked;
    setActionLoading((p) => ({ ...p, [user.id]: true }));
    try {
      await axiosInstance.patch(`/admin/users/${user.id}/block`, {
        isBlocked: newBlocked,
        reason: newBlocked ? "Blocked by admin" : "",
      });
      toast.success(newBlocked ? "Owner blocked" : "Owner unblocked");
      refetch();
    } catch (e) {
      toast.error(e.response?.data?.message || "Action failed");
    } finally {
      setActionLoading((p) => ({ ...p, [user.id]: false }));
    }
  };

  const columns = [
    userColumn("Owner"),
    { key: "phone", label: "Phone", sort: "phone" },
    { key: "companyName", label: "Company", sort: "companyName" },
    { key: "mainAddressCity", label: "City", sort: "mainAddressCity" },
    countColumn("restaurantCount", "Restaurants"),
    { key: "isBlocked", label: "Status", sort: "isBlocked", render: (v) => <StatusBadge status={v ? "blocked" : "active"} /> },
    { key: "createdAt", label: "Joined", sort: "createdAt", render: (v) => fmtDate(v) },
    {
      key: "actions",
      label: "Actions",
      render: (_v, u) => (
        <div className="act-row">
          <button className="act-btn act-btn--ghost" onClick={() => navigate(`/owners/${u.id}/restaurants`)} title="Restaurants">
            <FaStore />
          </button>
          <button
            className={`act-btn ${u.isBlocked ? "act-btn--success" : "act-btn--danger"}`}
            onClick={() => handleToggleBlock(u)}
            title={u.isBlocked ? "Unblock" : "Block"}
            disabled={actionLoading[u.id]}
          >
            {actionLoading[u.id] ? <span className="act-spin" /> : u.isBlocked ? <FaCheckCircle /> : <FaBan />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageShell
      title="Restaurant Owners"
      subtitle={`${metadata.total_records} owners registered`}
      stats={<StatsCard icon={FaUserTie} label="Total Owners" value={metadata.total_records} color="#3b82f6" />}
    >
      <FilterBar
        search={searchInput}
        onSearch={(v) => { setSearchInput(v); setPage(1); }}
        placeholder="Search by name, email or phone…"
        filters={[
          {
            key: "status",
            value: blockedFilter,
            placeholder: "All Status",
            onChange: (v) => { setBlockedFilter(v); setPage(1); },
            options: [
              { value: "false", label: "Active" },
              { value: "true", label: "Blocked" },
            ],
          },
        ]}
        onReset={() => { setSearchInput(""); setBlockedFilter(""); sort.resetSort(); setPage(1); }}
      />
      <DataTable onRowClick={(u) => navigate(`/owners/${u.id}/restaurants`)} columns={columns} data={owners} loading={loading} sort={sort} emptyText="No owners found" />
      <Pagination metadata={metadata} onPageChange={setPage} />
    </PageShell>
  );
}
