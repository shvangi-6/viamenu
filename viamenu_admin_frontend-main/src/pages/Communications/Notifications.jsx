import { useState } from "react";
import { FaBell } from "react-icons/fa";
import PageShell from "../../components/common/PageShell";
import StatsCard from "../../components/common/StatsCard";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import { useDataFetch, useDebounce } from "../../hooks/useDataFetch";
import { fmtDate } from "../../utils/fmtDate";
import { displayName } from "../../utils/displayName";

const TYPES = { ANNOUNCEMENT: "Announcement", SUBSCRIPTION: "Subscription", ORDER: "Order", SUPPORT: "Support" };

// Log of every in-app notification delivered (announcements, renewal
// reminders, order updates, support replies).
export default function Notifications() {
  const [type, setType] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput);
  const [page, setPage] = useState(1);
  const { data: rows, loading, metadata } = useDataFetch("/admin/communications/notifications", "notifications", { page, limit: 15, ...(type && { type }), ...(search && { search }) });

  const columns = [
    { key: "user", label: "Recipient", render: (u) => u ? <div className="nc-body"><span className="nc-name">{displayName(u) || "—"}</span><span className="nc-sub">{u.email}</span></div> : "—" },
    { key: "type", label: "Type", render: (v) => TYPES[v] ?? v },
    { key: "title", label: "Message", render: (v, n) => <div className="nc-body"><span className="nc-name">{v}</span><span className="description-text nc-sub" title={n.body}>{n.body}</span></div> },
    { key: "readAt", label: "Read", render: (v) => (v ? fmtDate(v) : <span className="nc-sub">Unread</span>) },
    { key: "createdAt", label: "Sent", render: (v) => fmtDate(v) },
  ];

  return (
    <PageShell title="Notifications" subtitle="Every in-app notification delivered to users" stats={<StatsCard icon={FaBell} label="Delivered" value={metadata.total_records} color="#2c8769" />}>
      <FilterBar
        search={searchInput}
        onSearch={(v) => { setSearchInput(v); setPage(1); }}
        placeholder="Search by title…"
        filters={[{ key: "type", value: type, placeholder: "All Types", onChange: (v) => { setType(v); setPage(1); }, options: Object.entries(TYPES).map(([value, label]) => ({ value, label })) }]}
        onReset={() => { setType(""); setSearchInput(""); setPage(1); }}
      />
      <DataTable columns={columns} data={rows} loading={loading} emptyText="Nothing delivered yet" />
      <Pagination metadata={metadata} onPageChange={setPage} />
    </PageShell>
  );
}
