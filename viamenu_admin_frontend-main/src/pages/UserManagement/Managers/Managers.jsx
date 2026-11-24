import { useState } from "react";
import { FaUserCog, FaBan, FaCheckCircle, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
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
import "./Managers.css";
import { displayName } from "../../../utils/displayName";

export default function Managers() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState({});
  const search = useDebounce(searchInput);
  const sort = useSortState("users-managers", "name", "asc");

  const params = { page, limit: 10, sortBy: sort.sortBy, sortOrder: sort.sortOrder, ...(search && { search }) };
  const { data: managers, loading, metadata, refetch } = useDataFetch("/admin/users/managers", "managers", params);

  const handleToggleBlock = async (user) => {
    const newBlocked = !user.isBlocked;
    setActionLoading((p) => ({ ...p, [user.id]: true }));
    try {
      await axiosInstance.patch(`/admin/users/${user.id}/block`, {
        isBlocked: newBlocked,
        reason: newBlocked ? "Blocked by admin" : "",
      });
      toast.success(newBlocked ? "Manager blocked" : "Manager unblocked");
      refetch();
    } catch (e) {
      toast.error(e.response?.data?.message || "Action failed");
    } finally {
      setActionLoading((p) => ({ ...p, [user.id]: false }));
    }
  };

  const columns = [
    userColumn("Manager"),
    {
      // Which owner this person works for. Read from accepted invites, so it
      // survives having every grant unassigned — otherwise an unassigned
      // manager looks ownerless.
      key: "owners",
      label: "Owner",
      sort: "owner",
      render: (owners) =>
        owners?.length ? (
          <div className="mgr-owners">
            {owners.map((o) => (
              <div key={o.id} className="mgr-owner">
                <div className="mgr-owner-name">{displayName(o)}</div>
                {o.companyName && <div className="mgr-owner-co">{o.companyName}</div>}
              </div>
            ))}
          </div>
        ) : "—",
    },
    {
      // "manager" alone says nothing about reach — a grant is either a whole
      // restaurant or single menus inside one.
      key: "assigned",
      label: "Assigned To",
      sort: "assigned",
      render: (_v, u) =>
        u.restaurants?.length || u.menus?.length ? (
          <div className="mgr-assign">
            {u.restaurants?.map((r) => (
              <span key={r.id} className="mgr-chip mgr-chip--rest" title="Full restaurant">{r.name}</span>
            ))}
            {u.menus?.map((m) => (
              <span key={m.id} className="mgr-chip mgr-chip--menu" title={`Menu in ${m.restaurant?.name ?? ""}`}>{m.name}</span>
            ))}
          </div>
        ) : (
          <span className="mgr-unassigned">Not assigned</span>
        ),
    },
    { key: "phone", label: "Phone", sort: "phone" },
    {
      key: "isEmailVerified",
      label: "Email Verified",
      sort: "isEmailVerified",
      render: (v) => <StatusBadge status={v ? "verified" : "unverified"} />,
    },
    { key: "isBlocked", label: "Status", sort: "isBlocked", render: (v) => <StatusBadge status={v ? "blocked" : "active"} /> },
    { key: "createdAt", label: "Joined", sort: "createdAt", render: (v) => fmtDate(v) },
    {
      key: "actions",
      label: "Actions",
      render: (_v, u) => (
        <div className="act-row">
          <button className="act-btn act-btn--ghost" onClick={() => navigate(`/users/managers/${u.id}`)} title="View">
            <FaEye />
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
      title="Managers"
      subtitle={`${metadata.total_records} managers registered`}
      stats={
        <>
          <StatsCard icon={FaUserCog} label="Total Managers"  value={metadata.total_records} color="#8b5cf6" />
          <StatsCard icon={FaBan}     label="Blocked (page)"  value={managers.filter((m) => m.isBlocked).length} color="#ef4444" />
        </>
      }
    >
      <FilterBar
        search={searchInput}
        onSearch={(v) => { setSearchInput(v); setPage(1); }}
        placeholder="Search by name, email or phone…"
        onReset={() => { setSearchInput(""); sort.resetSort(); setPage(1); }}
      />
      <DataTable onRowClick={(u) => navigate(`/users/managers/${u.id}`)} columns={columns} data={managers} loading={loading} sort={sort} emptyText="No managers found" />
      <Pagination metadata={metadata} onPageChange={setPage} />
    </PageShell>
  );
}
