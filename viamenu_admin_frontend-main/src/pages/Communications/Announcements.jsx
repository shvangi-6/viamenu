import { useState } from "react";
import { FaBullhorn, FaPlus, FaTrash, FaPaperPlane } from "react-icons/fa";
import { toast } from "react-toastify";
import PageShell from "../../components/common/PageShell";
import StatsCard from "../../components/common/StatsCard";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import Modal from "../../components/common/Modal";
import { useDataFetch } from "../../hooks/useDataFetch";
import axiosInstance from "../../utils/axiosInstance";
import { fmtDate } from "../../utils/fmtDate";

const AUDIENCE = { ALL: "Everyone", OWNERS: "Restaurant owners", MANAGERS: "Managers", GUESTS: "Guests" };

// Proposal "Notifications and Alerts": system-wide announcements by in-app
// notification and (optionally) email.
export default function Announcements() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const { data: rows, loading, metadata, refetch } = useDataFetch("/admin/communications/announcements", "announcements", { page, limit: 10 });

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title}"? Already delivered notifications stay with the users.`)) return;
    try {
      await axiosInstance.delete(`/admin/communications/announcements/${a.id}`);
      toast.success("Announcement deleted");
      refetch();
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    }
  };

  const columns = [
    { key: "title", label: "Title", render: (v, a) => <div className="nc-body"><span className="nc-name">{v}</span><span className="description-text nc-sub" title={a.body}>{a.body}</span></div> },
    { key: "audience", label: "Audience", render: (v) => AUDIENCE[v] },
    { key: "sendEmail", label: "Email", render: (v) => (v ? "Yes" : "No") },
    { key: "sendSms", label: "SMS", render: (v) => (v ? "Yes" : "No") },
    { key: "sentAt", label: "Sent", render: (v) => (v ? fmtDate(v) : <span className="nc-sub">Draft</span>) },
    { key: "actions", label: "Actions", render: (_v, a) => <div className="act-row"><button className="act-btn act-btn--danger" title="Delete" onClick={() => remove(a)}><FaTrash /></button></div> },
  ];

  return (
    <PageShell
      title="Announcements"
      subtitle="System-wide messages to owners, managers and guests"
      actions={<button className="ps-btn" onClick={() => setOpen(true)}><FaPlus /> New announcement</button>}
      stats={<StatsCard icon={FaBullhorn} label="Announcements" value={metadata.total_records} color="#2c8769" />}
    >
      <DataTable columns={columns} data={rows} loading={loading} emptyText="No announcements yet" />
      <Pagination metadata={metadata} onPageChange={setPage} />
      {open && <NewAnnouncement onClose={() => setOpen(false)} onDone={() => { setOpen(false); refetch(); }} />}
    </PageShell>
  );
}

function NewAnnouncement({ onClose, onDone }) {
  const [form, setForm] = useState({ title: "", body: "", audience: "ALL", sendEmail: false, sendSms: false });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const submit = async (send) => {
    setSaving(true);
    try {
      const r = await axiosInstance.post("/admin/communications/announcements", { ...form, send });
      toast.success(send ? `Sent to ${r.data.data.recipients} user(s)` : "Saved as draft");
      onDone();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not save the announcement");
    } finally {
      setSaving(false);
    }
  };
  const ok = form.title.trim() && form.body.trim();

  return (
    <Modal
      title="New announcement"
      onClose={onClose}
      footer={<>
        <button className="btn-plain" disabled={!ok || saving} onClick={() => submit(false)}>Save draft</button>
        <button className="ps-btn" disabled={!ok || saving} onClick={() => submit(true)}><FaPaperPlane /> {saving ? "Sending…" : "Send now"}</button>
      </>}
    >
      <div className="fm-field"><label className="fm-label">Title *</label><input className="fm-input" value={form.title} onChange={set("title")} maxLength={150} /></div>
      <div className="fm-field"><label className="fm-label">Message *</label><textarea className="fm-textarea" value={form.body} onChange={set("body")} maxLength={5000} /></div>
      <div className="fm-field">
        <label className="fm-label">Audience</label>
        <select className="fm-select" value={form.audience} onChange={set("audience")}>
          {Object.entries(AUDIENCE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <label className="fm-check"><input type="checkbox" checked={form.sendEmail} onChange={set("sendEmail")} /> Also send by email</label>
      <label className="fm-check"><input type="checkbox" checked={form.sendSms} onChange={set("sendSms")} /> Also send by SMS (to users with a phone number)</label>
      <p className="fm-hint">Everyone in the audience gets it in their in-app inbox when you press “Send now”.</p>
    </Modal>
  );
}
