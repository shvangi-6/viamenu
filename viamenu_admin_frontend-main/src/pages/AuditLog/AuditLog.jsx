import { useState } from "react";
import { FaHistory, FaEye } from "react-icons/fa";
import PageShell from "../../components/common/PageShell";
import StatsCard from "../../components/common/StatsCard";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import Modal from "../../components/common/Modal";
import { useDataFetch } from "../../hooks/useDataFetch";

// Areas worth filtering by (Prisma model names, as the log stores them).
const MODELS = ["User", "Restaurant", "Menu", "Category", "Dish", "SubscriptionPlan", "UserSubscription", "Payment", "Order", "RestaurantPage", "Tag", "Setting", "SupportTicket"];
const ACTION_CLS = { CREATE: "badge--published", UPDATE: "badge--verified", DELETE: "badge--blocked" };

// Proposal "Audit Log": a trail of every change — user accounts,
// subscriptions, menu edits and deletions — with who did it and when.
export default function AuditLog() {
  const [model, setModel] = useState("");
  const [action, setAction] = useState("");
  const [actorType, setActorType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const { data: logs, loading, metadata } = useDataFetch("/admin/audit-logs", "logs", {
    page, limit: 20, ...(model && { model }), ...(action && { action }), ...(actorType && { actorType }),
    ...(from && { from }), ...(to && { to: `${to}T23:59:59` }),
  });

  const columns = [
    { key: "occurredAt", label: "When", render: (v) => new Date(v).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) },
    { key: "action", label: "Action", render: (v) => <span className={`status-badge ${ACTION_CLS[v] ?? "badge--default"}`}>{v}</span> },
    { key: "model", label: "Area" },
    { key: "recordId", label: "Record", render: (v) => (v ? <span className="nc-id">{v}</span> : "—") },
    { key: "actorEmail", label: "By", render: (v, l) => <div className="nc-body"><span>{v || (l.actorType === "SYSTEM" ? "System" : l.actorId || "—")}</span><span className="nc-sub">{l.actorType}</span></div> },
    { key: "actions", label: "Actions", render: (_v, l) => <div className="act-row"><button className="act-btn act-btn--ghost" title="See the change" onClick={() => setViewing(l)}><FaEye /></button></div> },
  ];

  return (
    <PageShell title="Audit Log" subtitle="Every change made through the admin panel and the apps" stats={<StatsCard icon={FaHistory} label="Entries" value={metadata.total_records} color="#2c8769" />}>
      <FilterBar
        filters={[
          { key: "model", value: model, placeholder: "All Areas", onChange: (v) => { setModel(v); setPage(1); }, options: MODELS.map((m) => ({ value: m, label: m })) },
          { key: "action", value: action, placeholder: "All Actions", onChange: (v) => { setAction(v); setPage(1); }, options: ["CREATE", "UPDATE", "DELETE"].map((a) => ({ value: a, label: a.charAt(0) + a.slice(1).toLowerCase() })) },
          { key: "actor", value: actorType, placeholder: "Anyone", onChange: (v) => { setActorType(v); setPage(1); }, options: [{ value: "ADMIN", label: "Admins" }, { value: "USER", label: "App users" }, { value: "SYSTEM", label: "System" }] },
        ]}
        onReset={() => { setModel(""); setAction(""); setActorType(""); setFrom(""); setTo(""); setPage(1); }}
      >
        <input className="fb-select" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} title="From" />
        <input className="fb-select" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} title="To" />
      </FilterBar>
      <DataTable onRowClick={setViewing} columns={columns} data={logs} loading={loading} emptyText="No changes recorded for these filters" />
      <Pagination metadata={metadata} onPageChange={setPage} />
      {viewing && (
        <Modal wide title={`${viewing.action} · ${viewing.model}`} onClose={() => setViewing(null)}>
          <ChangeTable before={viewing.before} after={viewing.after} />
        </Modal>
      )}
    </PageShell>
  );
}

// Field-by-field before → after, only for fields that actually changed.
function ChangeTable({ before, after }) {
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])]
    .filter((k) => !["updatedAt", "updatedBy"].includes(k) && JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k]));
  if (!keys.length) return <p className="nc-sub">No field-level details recorded.</p>;
  const fmt = (v) => (v === undefined ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));
  return (
    <table className="dt-table">
      <thead><tr><th>Field</th><th>Before</th><th>After</th></tr></thead>
      <tbody>
        {keys.map((k) => (
          <tr key={k}>
            <td><b>{k}</b></td>
            <td style={{ color: "#991b1b", wordBreak: "break-word" }}>{fmt(before?.[k])}</td>
            <td style={{ color: "#065f46", wordBreak: "break-word" }}>{fmt(after?.[k])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
