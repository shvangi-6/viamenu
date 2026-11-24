import { useEffect, useState } from "react";
import { FaLifeRing, FaInbox, FaSpinner, FaCheckCircle, FaComments } from "react-icons/fa";
import { toast } from "react-toastify";
import PageShell from "../../components/common/PageShell";
import StatsCard from "../../components/common/StatsCard";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import Modal from "../../components/common/Modal";
import { useDataFetch, useDebounce } from "../../hooks/useDataFetch";
import axiosInstance from "../../utils/axiosInstance";
import { fmtDate } from "../../utils/fmtDate";
import { displayName } from "../../utils/displayName";

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const label = (s) => s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ");

// Proposal "Technical Support and Issue Resolution": tickets from users,
// track resolution, and see which categories keep recurring.
export default function SupportTickets() {
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);
  const search = useDebounce(searchInput);
  const { data: tickets, loading, metadata, raw, refetch } = useDataFetch("/admin/support", "tickets", { page, limit: 10, ...(search && { search }), ...(status && { status }) });
  const stats = raw?.stats ?? {};

  const columns = [
    { key: "subject", label: "Subject", render: (v, t) => <div className="nc-body"><span className="nc-name">{v}</span>{t.category && <span className="nc-sub">{t.category}</span>}</div> },
    { key: "user", label: "From", render: (u) => u ? <div className="nc-body"><span>{displayName(u) || "—"}</span><span className="nc-sub">{u.email} · {u.role}</span></div> : "—" },
    { key: "status", label: "Status", render: (v) => <StatusBadge status={v} /> },
    { key: "_count", label: "Messages", render: (c) => <span className="count-badge count-badge--blue">{c?.messages ?? 0}</span> },
    { key: "updatedAt", label: "Last activity", render: (v) => fmtDate(v) },
    { key: "actions", label: "Actions", render: (_v, t) => <div className="act-row"><button className="act-btn act-btn--ghost" title="Open conversation" onClick={() => setOpenId(t.id)}><FaComments /></button></div> },
  ];

  return (
    <PageShell
      title="Support Tickets"
      subtitle={raw?.categories?.length ? `Most frequent: ${raw.categories.slice(0, 3).map((c) => `${c.category} (${c.count})`).join(", ")}` : "Requests from owners, managers and guests"}
      stats={<>
        <StatsCard icon={FaInbox}       label="Open"        value={stats.OPEN ?? 0}        color="#3b82f6" />
        <StatsCard icon={FaSpinner}     label="In progress" value={stats.IN_PROGRESS ?? 0} color="#f59e0b" />
        <StatsCard icon={FaCheckCircle} label="Resolved"    value={stats.RESOLVED ?? 0}    color="#22c55e" />
        <StatsCard icon={FaLifeRing}    label="Closed"      value={stats.CLOSED ?? 0}      color="#64748b" />
      </>}
    >
      <FilterBar
        search={searchInput}
        onSearch={(v) => { setSearchInput(v); setPage(1); }}
        placeholder="Search by subject…"
        filters={[{ key: "status", value: status, placeholder: "All Status", onChange: (v) => { setStatus(v); setPage(1); }, options: STATUSES.map((s) => ({ value: s, label: label(s) })) }]}
        onReset={() => { setSearchInput(""); setStatus(""); setPage(1); }}
      />
      <DataTable onRowClick={(t) => setOpenId(t.id)} columns={columns} data={tickets} loading={loading} emptyText="No tickets" />
      <Pagination metadata={metadata} onPageChange={setPage} />
      {openId && <TicketModal id={openId} onClose={() => { setOpenId(null); refetch(); }} />}
    </PageShell>
  );
}

function TicketModal({ id, onClose }) {
  const [t, setT] = useState(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const load = () => axiosInstance.get(`/admin/support/${id}`).then((r) => setT(r.data.data)).catch(() => toast.error("Could not load the ticket"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  const update = async (patch) => {
    setSaving(true);
    try {
      await axiosInstance.patch(`/admin/support/${id}`, patch);
      if (patch.reply) setReply("");
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      wide
      title={t ? t.subject : "Ticket"}
      onClose={onClose}
      footer={t && <>
        <select className="fm-select" style={{ width: 170 }} value={t.status} disabled={saving} onChange={(e) => update({ status: e.target.value })}>
          {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <input className="fm-input" style={{ width: 170 }} placeholder="Category (e.g. billing)" defaultValue={t.category || ""} onBlur={(e) => e.target.value !== (t.category || "") && update({ category: e.target.value })} />
        <button className="ps-btn" disabled={!reply.trim() || saving} onClick={() => update({ reply })}>Send reply</button>
      </>}
    >
      {!t ? <div className="dt-spinner" style={{ margin: "30px auto" }} /> : (
        <>
          <p className="nc-sub" style={{ marginTop: 0 }}>{t.user?.name || "—"} · {t.user?.email} · opened {fmtDate(t.createdAt)}</p>
          <div className="thread">
            {t.messages.map((m) => (
              <div key={m.id} className={`msg ${m.authorType === "ADMIN" ? "msg--admin" : "msg--user"}`}>
                {m.body}
                <div className="msg-meta">{m.authorType === "ADMIN" ? "Support" : "User"} · {new Date(m.createdAt).toLocaleString("en-GB", { hour12: true })}</div>
              </div>
            ))}
          </div>
          <textarea className="fm-textarea" style={{ marginTop: 14 }} placeholder="Write a reply — the user gets it in their inbox" value={reply} onChange={(e) => setReply(e.target.value)} />
        </>
      )}
    </Modal>
  );
}
