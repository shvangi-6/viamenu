import { useState } from "react";
import { FaFileInvoice, FaUndo, FaCheckCircle, FaClock, FaTimesCircle, FaEuroSign } from "react-icons/fa";
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

const API = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const eur = (n) => `€${Number(n || 0).toFixed(2)}`;

// Proposal Phase 1 "Payment Management": transactions + statuses, refunds,
// invoices, and totals for reporting.
export default function Payments() {
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");
  const [page, setPage] = useState(1);
  const [refunding, setRefunding] = useState(null);
  const search = useDebounce(searchInput);
  const sort = useSortState("payments");

  const params = { page, limit: 10, sortBy: sort.sortBy, sortOrder: sort.sortOrder, ...(search && { search }), ...(status && { status }), ...(kind && { kind }) };
  const { data: payments, loading, metadata, raw, refetch } = useDataFetch("/admin/billing/payments", "payments", params);
  const totals = raw?.totals ?? {};

  const columns = [
    {
      key: "user", label: "Payer",
      render: (u, p) => u ? (
        <div className="nc-body"><span className="nc-name">{u.name?.trim() || u.username || u.companyName || "—"}</span><span className="nc-sub">{u.email}</span></div>
      ) : <span className="nc-sub">{p.orderId ? "Guest" : "—"}</span>,
    },
    { key: "for", label: "For", render: (_v, p) => p.subscription ? `Plan: ${p.subscription.planName}` : p.order ? `Order #${p.order.number}` : "—" },
    { key: "amount", label: "Amount", sort: "amount", render: (v) => <span className="price">{eur(v)}</span> },
    { key: "provider", label: "Method", render: (v) => (v === "MANUAL" ? "Manual" : v.charAt(0) + v.slice(1).toLowerCase()) },
    { key: "status", label: "Status", sort: "status", render: (v, p) => <span title={p.refundReason || ""}><StatusBadge status={v} /></span> },
    { key: "createdAt", label: "Date", sort: "createdAt", render: (v) => fmtDate(v) },
    {
      key: "actions", label: "Actions",
      render: (_v, p) => (
        <div className="act-row">
          {p.invoice && (
            <a className="act-btn act-btn--ghost" title={`Invoice ${p.invoice.number}`} href={`${API}/admin/billing/invoices/${p.invoice.id}`} target="_blank" rel="noopener noreferrer"><FaFileInvoice /></a>
          )}
          {p.status === "PAID" && <button className="act-btn act-btn--danger" title="Refund" onClick={() => setRefunding(p)}><FaUndo /></button>}
        </div>
      ),
    },
  ];

  return (
    <PageShell
      title="Payments & Invoices"
      subtitle="Subscription and order payments across the platform"
      stats={
        <>
          <StatsCard icon={FaEuroSign}    label="Revenue (paid)" value={eur(totals.PAID?.amount)} color="#2c8769" />
          <StatsCard icon={FaCheckCircle} label="Paid"     value={totals.PAID?.count ?? 0}     color="#22c55e" />
          <StatsCard icon={FaClock}       label="Pending"  value={totals.PENDING?.count ?? 0}  color="#f59e0b" />
          <StatsCard icon={FaTimesCircle} label="Failed / refunded" value={(totals.FAILED?.count ?? 0) + (totals.REFUNDED?.count ?? 0)} color="#ef4444" />
        </>
      }
    >
      <FilterBar
        search={searchInput}
        onSearch={(v) => { setSearchInput(v); setPage(1); }}
        placeholder="Search by payer name, email or company…"
        filters={[
          { key: "status", value: status, placeholder: "All Status", onChange: (v) => { setStatus(v); setPage(1); },
            options: ["PAID", "PENDING", "FAILED", "REFUNDED"].map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() })) },
          { key: "kind", value: kind, placeholder: "All Types", onChange: (v) => { setKind(v); setPage(1); },
            options: [{ value: "subscription", label: "Subscriptions" }, { value: "order", label: "Orders" }] },
        ]}
        onReset={() => { setSearchInput(""); setStatus(""); setKind(""); sort.resetSort(); setPage(1); }}
      />
      <DataTable columns={columns} data={payments} loading={loading} sort={sort} emptyText="No payments yet" />
      <Pagination metadata={metadata} onPageChange={setPage} />
      {refunding && <RefundModal payment={refunding} onClose={() => setRefunding(null)} onDone={() => { setRefunding(null); refetch(); }} />}
    </PageShell>
  );
}

function RefundModal({ payment, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const refund = async () => {
    setSaving(true);
    try {
      await axiosInstance.post(`/admin/billing/payments/${payment.id}/refund`, { reason });
      toast.success("Payment refunded");
      onDone();
    } catch (e) {
      toast.error(e.response?.data?.message || "Refund failed");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      title={`Refund ${eur(payment.amount)}`}
      onClose={onClose}
      footer={<><button className="btn-plain" onClick={onClose}>Cancel</button><button className="btn-danger" disabled={saving} onClick={refund}>{saving ? "Refunding…" : "Refund"}</button></>}
    >
      <p style={{ marginTop: 0, fontSize: 13 }}>
        {payment.provider === "STRIPE" ? "The money is returned to the payer through Stripe." : "This was a manual payment — mark it refunded after returning the money yourself."}
        {payment.subscriptionId && " The owner's subscription is canceled."}
      </p>
      <label className="fm-label">Reason</label>
      <textarea className="fm-textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this refunded? (kept for disputes)" />
    </Modal>
  );
}
