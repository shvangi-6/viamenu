import { useState } from "react";
import { FaReceipt, FaEuroSign, FaClock, FaCheckCircle, FaEye } from "react-icons/fa";
import PageShell from "../../components/common/PageShell";
import StatsCard from "../../components/common/StatsCard";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import Modal from "../../components/common/Modal";
import { useDataFetch } from "../../hooks/useDataFetch";

const eur = (n) => `€${Number(n || 0).toFixed(2)}`;
const TYPE = { DINE_IN: "At table", PICKUP: "Pick-up", DELIVERY: "Delivery" };
const STATUSES = ["ORDERED", "PREPARING", "READY", "DELIVERED", "CANCELLED"];

// Proposal Phase 3 admin "Order Management": view and filter orders by
// restaurant, status or date, with totals for reporting.
export default function AllOrders() {
  const [status, setStatus] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const { data: restaurants } = useDataFetch("/admin/restaurant/all", "restaurants", { limit: 100, sortBy: "name", sortOrder: "asc" });
  const { data: orders, loading, metadata, raw } = useDataFetch("/admin/orders", "orders", {
    page, limit: 10, ...(status && { status }), ...(restaurantId && { restaurantId }), ...(from && { from }), ...(to && { to }),
  });
  const summary = raw?.summary ?? { byStatus: {} };
  const reset = () => { setStatus(""); setRestaurantId(""); setFrom(""); setTo(""); setPage(1); };

  const columns = [
    { key: "number", label: "Order", render: (v, o) => <div className="nc-body"><span className="nc-name">#{v}</span><span className="nc-sub">{TYPE[o.type]}{o.tableNo ? ` · table ${o.tableNo}` : ""}</span></div> },
    { key: "restaurantName", label: "Restaurant" },
    { key: "guestName", label: "Guest", render: (v, o) => v || o.guestPhone || <span className="nc-sub">Anonymous</span> },
    { key: "total", label: "Total", render: (v) => <span className="price">{eur(v)}</span> },
    { key: "paymentStatus", label: "Payment", render: (v, o) => <span title={o.paymentMethod === "ONLINE" ? "Online" : "At table"}><StatusBadge status={v} /></span> },
    { key: "status", label: "Status", render: (v) => <StatusBadge status={v} /> },
    { key: "createdAt", label: "Placed", render: (v) => new Date(v).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true }) },
    { key: "actions", label: "Actions", render: (_v, o) => <div className="act-row"><button className="act-btn act-btn--ghost" title="Details" onClick={() => setViewing(o)}><FaEye /></button></div> },
  ];

  return (
    <PageShell
      title="Orders"
      subtitle="Guest orders across all restaurants"
      stats={<>
        <StatsCard icon={FaReceipt}     label="Orders (not cancelled)" value={summary.orders ?? 0} color="#2c8769" />
        <StatsCard icon={FaEuroSign}    label="Revenue"   value={eur(summary.revenue)} color="#3b82f6" />
        <StatsCard icon={FaClock}       label="Open"      value={(summary.byStatus.ORDERED ?? 0) + (summary.byStatus.PREPARING ?? 0) + (summary.byStatus.READY ?? 0)} color="#f59e0b" />
        <StatsCard icon={FaCheckCircle} label="Delivered" value={summary.byStatus.DELIVERED ?? 0} color="#22c55e" />
      </>}
    >
      <FilterBar
        filters={[
          { key: "restaurant", value: restaurantId, placeholder: "All Restaurants", onChange: (v) => { setRestaurantId(v); setPage(1); }, options: restaurants.map((r) => ({ value: r.id, label: r.name })) },
          { key: "status", value: status, placeholder: "All Status", onChange: (v) => { setStatus(v); setPage(1); }, options: STATUSES.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() })) },
        ]}
        onReset={reset}
      >
        <input className="fb-select" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} title="From" />
        <input className="fb-select" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} title="To" />
      </FilterBar>
      <DataTable onRowClick={setViewing} columns={columns} data={orders} loading={loading} emptyText="No orders" />
      <Pagination metadata={metadata} onPageChange={setPage} />
      {viewing && (
        <Modal title={`Order #${viewing.number} — ${viewing.restaurantName ?? ""}`} onClose={() => setViewing(null)}>
          <table className="dt-table">
            <tbody>
              {(viewing.items || []).map((l, i) => (
                <tr key={i}>
                  <td>{l.qty}×</td>
                  <td>{l.name}{l.variant ? ` (${l.variant.name})` : ""}{l.extras?.length ? <div className="nc-sub">+ {l.extras.map((e) => e.name).join(", ")}</div> : null}</td>
                  <td style={{ textAlign: "right" }}>{eur(l.lineTotal)}</td>
                </tr>
              ))}
              <tr><td /><td><b>Total</b></td><td style={{ textAlign: "right" }}><b>{eur(viewing.total)}</b></td></tr>
            </tbody>
          </table>
          {viewing.note && <p style={{ fontSize: 13 }}><b>Note:</b> {viewing.note}</p>}
          <p className="nc-sub">Status history: {(viewing.statusHistory || []).map((h) => `${h.status.toLowerCase()} ${new Date(h.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })}`).join(" → ")}</p>
        </Modal>
      )}
    </PageShell>
  );
}
