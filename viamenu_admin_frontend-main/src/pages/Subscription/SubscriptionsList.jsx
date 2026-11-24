import { useState } from "react";
import { FaUserPlus, FaCheckCircle, FaPauseCircle, FaBan, FaClock, FaPlus, FaPlay } from "react-icons/fa";
import { toast } from "react-toastify";
import PageShell from "../../components/common/PageShell";
import StatsCard from "../../components/common/StatsCard";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import Modal from "../../components/common/Modal";
import { useDataFetch, useDebounce } from "../../hooks/useDataFetch";
import { useSortState } from "../../hooks/useSortState";
import axiosInstance from "../../utils/axiosInstance";
import { fmtDate } from "../../utils/fmtDate";
import { userColumn } from "../UserManagement/userColumns";
import { displayName } from "../../utils/displayName";

const eur = (n) => `€${Number(n || 0).toFixed(2)}`;

// Active subscriptions (scope="active") and the full history (scope="history").
export default function SubscriptionsList({ scope }) {
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [assignOpen, setAssignOpen] = useState(false);
  const search = useDebounce(searchInput);
  const sort = useSortState(`subscriptions-${scope}`, scope === "active" ? "endDate" : "createdAt", scope === "active" ? "asc" : "desc");

  const params = { page, limit: 10, scope, sortBy: sort.sortBy, sortOrder: sort.sortOrder, ...(search && { search }), ...(status && { status }) };
  const { data: subs, loading, metadata, raw, refetch } = useDataFetch("/admin/billing/subscriptions", "subscriptions", params);
  const stats = raw?.stats ?? {};

  const act = async (s, action) => {
    try {
      await axiosInstance.patch(`/admin/billing/subscriptions/${s.id}`, { action });
      toast.success(`Subscription ${action === "extend" ? "extended by one period" : action + "d"}`);
      refetch();
    } catch (e) {
      toast.error(e.response?.data?.message || "Action failed");
    }
  };

  const columns = [
    userColumn("Owner"),
    { key: "planName", label: "Plan", sort: "planName" },
    { key: "price", label: "Price", render: (v, s) => `${eur(v)} / ${s.validity === "year" ? "year" : "month"}` },
    { key: "status", label: "Status", sort: "status", render: (v) => <StatusBadge status={v} /> },
    { key: "provider", label: "Paid via", render: (v) => (v === "MANUAL" ? "Manual / free" : v.charAt(0) + v.slice(1).toLowerCase()) },
    { key: "startDate", label: "Start", sort: "startDate", render: (v) => fmtDate(v) },
    { key: "endDate", label: "End", sort: "endDate", render: (v) => fmtDate(v) },
    {
      key: "actions",
      label: "Actions",
      render: (_v, s) => (
        <div className="act-row">
          {["ACTIVE", "PAUSED", "CANCELED"].includes(s.status) && (
            <button className="act-btn act-btn--success" title="Extend by one period (free)" onClick={() => act(s, "extend")}><FaPlus /></button>
          )}
          {s.status === "ACTIVE" && <button className="act-btn act-btn--ghost" title="Pause" onClick={() => act(s, "pause")}><FaPauseCircle /></button>}
          {["PAUSED", "CANCELED"].includes(s.status) && <button className="act-btn act-btn--ghost" title="Resume" onClick={() => act(s, "resume")}><FaPlay /></button>}
          {["ACTIVE", "PAUSED"].includes(s.status) && <button className="act-btn act-btn--danger" title="Cancel (runs to end date)" onClick={() => act(s, "cancel")}><FaBan /></button>}
        </div>
      ),
    },
  ];

  return (
    <PageShell
      title={scope === "active" ? "Active Subscriptions" : "Subscription History"}
      subtitle={scope === "active" ? "Owners with a running plan" : "Every subscription period ever started"}
      actions={<button className="ps-btn" onClick={() => setAssignOpen(true)}><FaUserPlus /> Assign plan</button>}
      stats={
        <>
          <StatsCard icon={FaCheckCircle} label="Active"   value={stats.ACTIVE ?? 0}   color="#22c55e" />
          <StatsCard icon={FaPauseCircle} label="Paused"   value={stats.PAUSED ?? 0}   color="#f59e0b" />
          <StatsCard icon={FaBan}         label="Canceled" value={stats.CANCELED ?? 0} color="#64748b" />
          <StatsCard icon={FaClock}       label="Expired"  value={stats.EXPIRED ?? 0}  color="#ef4444" />
        </>
      }
    >
      <FilterBar
        search={searchInput}
        onSearch={(v) => { setSearchInput(v); setPage(1); }}
        placeholder="Search by owner name, email, company or plan…"
        filters={[{
          key: "status", value: status, placeholder: "All Status", onChange: (v) => { setStatus(v); setPage(1); },
          options: ["ACTIVE", "PAUSED", "CANCELED", "EXPIRED", "PENDING"].map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() })),
        }]}
        onReset={() => { setSearchInput(""); setStatus(""); sort.resetSort(); setPage(1); }}
      />
      <DataTable columns={columns} data={subs} loading={loading} sort={sort} emptyText="No subscriptions found" />
      <Pagination metadata={metadata} onPageChange={setPage} />
      {assignOpen && <AssignPlanModal onClose={() => setAssignOpen(false)} onDone={() => { setAssignOpen(false); refetch(); }} />}
    </PageShell>
  );
}

function AssignPlanModal({ onClose, onDone }) {
  const [owner, setOwner] = useState("");
  const [planId, setPlanId] = useState("");
  const [saving, setSaving] = useState(false);
  const ownerSearch = useDebounce(owner);
  const { data: owners } = useDataFetch("/admin/users/owners", "owners", { limit: 8, ...(ownerSearch && { search: ownerSearch }) });
  const { data: plans } = useDataFetch("/admin/subscription", "plans", { limit: 50, status: "true" });
  const [userId, setUserId] = useState("");

  const save = async () => {
    setSaving(true);
    try {
      await axiosInstance.post("/admin/billing/subscriptions", { userId, planId });
      toast.success("Plan assigned");
      onDone();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not assign the plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Assign a plan to an owner"
      onClose={onClose}
      footer={<><button className="btn-plain" onClick={onClose}>Cancel</button><button className="ps-btn" disabled={!userId || !planId || saving} onClick={save}>{saving ? "Assigning…" : "Assign plan"}</button></>}
    >
      <div className="fm-field">
        <label className="fm-label">Owner *</label>
        <input className="fm-input" placeholder="Search owner by name or email…" value={owner} onChange={(e) => { setOwner(e.target.value); setUserId(""); }} />
        <select className="fm-select" style={{ marginTop: 6 }} value={userId} onChange={(e) => setUserId(e.target.value)} size={Math.min(5, Math.max(2, owners.length))}>
          {owners.map((o) => <option key={o.id} value={o.id}>{displayName(o) || "—"} · {o.email}</option>)}
        </select>
      </div>
      <div className="fm-field">
        <label className="fm-label">Plan *</label>
        <select className="fm-select" value={planId} onChange={(e) => setPlanId(e.target.value)}>
          <option value="">Choose a plan…</option>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.planName} — {eur(p.price)} / {p.validity === "year" ? "year" : "month"}</option>)}
        </select>
        <p className="fm-hint">Starts today (or after the owner's current period) with no payment — use for free plans, invoices paid by bank transfer, or support cases. An invoice is still issued.</p>
      </div>
    </Modal>
  );
}
