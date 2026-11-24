import { useState } from "react";
import { FaBan, FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";
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
import { userColumn } from "../userColumns";

export default function BlockedUsers() {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState({});
  const search = useDebounce(searchInput);
  const sort = useSortState("users-blocked");

  const params = { page, limit: 10, sortBy: sort.sortBy, sortOrder: sort.sortOrder, ...(search && { search }) };
  const { data: users, loading, metadata, refetch } = useDataFetch("/admin/users/blocked", "users", params);

  const handleUnblock = async (user) => {
    setActionLoading((p) => ({ ...p, [user.id]: true }));
    try {
      await axiosInstance.patch(`/admin/users/${user.id}/block`, { isBlocked: false });
      toast.success("User unblocked successfully");
      refetch();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to unblock");
    } finally {
      setActionLoading((p) => ({ ...p, [user.id]: false }));
    }
  };

  const columns = [
    userColumn("User"),
    { key: "role", label: "Role", sort: "role", render: (v) => <StatusBadge status={v} /> },
    { key: "phone", label: "Phone", sort: "phone" },
    { key: "blockReason", label: "Block Reason", sort: "blockReason", render: (v) => v || <span className="nc-sub">No reason given</span> },
    { key: "createdAt", label: "Registered", sort: "createdAt", render: (v) => fmtDate(v) },
    {
      key: "actions",
      label: "Actions",
      render: (_v, u) => (
        <div className="act-row">
          <button className="act-btn act-btn--success" onClick={() => handleUnblock(u)} title="Unblock" disabled={actionLoading[u.id]}>
            {actionLoading[u.id] ? <span className="act-spin" /> : <FaCheckCircle />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageShell
      title="Blocked Users"
      subtitle={`${metadata.total_records} users currently blocked`}
      stats={<StatsCard icon={FaBan} label="Blocked Users" value={metadata.total_records} color="#ef4444" />}
    >
      <FilterBar
        search={searchInput}
        onSearch={(v) => { setSearchInput(v); setPage(1); }}
        placeholder="Search by name, email or phone…"
        onReset={() => { setSearchInput(""); sort.resetSort(); setPage(1); }}
      />
      <DataTable columns={columns} data={users} loading={loading} sort={sort} emptyText="No blocked users found" />
      <Pagination metadata={metadata} onPageChange={setPage} />
    </PageShell>
  );
}
