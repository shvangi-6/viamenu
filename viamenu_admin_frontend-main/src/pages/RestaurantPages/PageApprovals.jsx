import { useState } from "react";
import { FaFileAlt, FaCheck, FaTimes, FaEye } from "react-icons/fa";
import { toast } from "react-toastify";
import PageShell from "../../components/common/PageShell";
import StatsCard from "../../components/common/StatsCard";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import Modal from "../../components/common/Modal";
import { useDataFetch } from "../../hooks/useDataFetch";
import axiosInstance from "../../utils/axiosInstance";
import { fmtDate } from "../../utils/fmtDate";

// Proposal Phase 2 "CMS Features for Restaurant Pages": approve or reject the
// mini homepages restaurants submit, after previewing the content.
export default function PageApprovals() {
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState(null);
  const { data: pages, loading, metadata, refetch } = useDataFetch("/admin/pages", "pages", { page, limit: 10, ...(status && { status }) });

  const decide = async (p, decision) => {
    const note = decision === "REJECTED" ? window.prompt("Reason for rejecting (shown to the owner):") : "";
    if (note === null) return;
    try {
      await axiosInstance.patch(`/admin/pages/${p.id}`, { decision, note });
      toast.success(decision === "APPROVED" ? "Page approved — now public" : "Page rejected");
      setPreview(null);
      refetch();
    } catch (e) {
      toast.error(e.response?.data?.message || "Action failed");
    }
  };

  const columns = [
    { key: "title", label: "Page", render: (v, p) => <div className="nc-body"><span className="nc-name">{v}</span><span className="nc-sub">/{p.slug}</span></div> },
    { key: "restaurant", label: "Restaurant", render: (r) => r?.name ?? "—" },
    { key: "status", label: "Status", render: (v, p) => <span title={p.reviewNote || ""}><StatusBadge status={v} /></span> },
    { key: "submittedAt", label: "Submitted", render: (v) => fmtDate(v) },
    {
      key: "actions", label: "Actions",
      render: (_v, p) => (
        <div className="act-row">
          <button className="act-btn act-btn--ghost" title="Preview" onClick={() => setPreview(p)}><FaEye /></button>
          {p.status !== "APPROVED" && <button className="act-btn act-btn--success" title="Approve" onClick={() => decide(p, "APPROVED")}><FaCheck /></button>}
          {p.status !== "REJECTED" && <button className="act-btn act-btn--danger" title="Reject" onClick={() => decide(p, "REJECTED")}><FaTimes /></button>}
        </div>
      ),
    },
  ];

  return (
    <PageShell title="Restaurant Pages" subtitle="Mini homepages restaurants publish for guests" stats={<StatsCard icon={FaFileAlt} label={status ? `${status.charAt(0) + status.slice(1).toLowerCase()} pages` : "Pages"} value={metadata.total_records} color="#2c8769" />}>
      <FilterBar
        filters={[{ key: "status", value: status, placeholder: "All Status", onChange: (v) => { setStatus(v); setPage(1); }, options: ["PENDING", "APPROVED", "REJECTED", "DRAFT"].map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() })) }]}
        onReset={() => { setStatus("PENDING"); setPage(1); }}
      />
      <DataTable onRowClick={setPreview} columns={columns} data={pages} loading={loading} emptyText={status === "PENDING" ? "Nothing waiting for approval" : "No pages"} />
      <Pagination metadata={metadata} onPageChange={setPage} />
      {preview && (
        <Modal wide title={`${preview.restaurant?.name ?? ""} — ${preview.title}`} onClose={() => setPreview(null)}
          footer={<><button className="btn-danger" onClick={() => decide(preview, "REJECTED")}>Reject</button><button className="ps-btn" onClick={() => decide(preview, "APPROVED")}>Approve</button></>}>
          <BlocksPreview blocks={preview.blocks} />
        </Modal>
      )}
    </PageShell>
  );
}

// Same block types the guest app renders, as plain text/images.
function BlocksPreview({ blocks = [] }) {
  if (!blocks.length) return <p className="nc-sub">This page is empty.</p>;
  return blocks.map((b, i) => {
    switch (b.type) {
      case "headline": return <h2 key={i}>{b.text}</h2>;
      case "subheadline": return <h3 key={i}>{b.text}</h3>;
      case "text": return <p key={i} style={{ whiteSpace: "pre-wrap" }}>{b.text}</p>;
      case "image": return <figure key={i} style={{ margin: "10px 0" }}><img src={b.url} alt={b.caption} style={{ maxWidth: "100%", borderRadius: 8 }} />{b.caption && <figcaption className="nc-sub">{b.caption}</figcaption>}</figure>;
      case "button": return <p key={i}><span className="ps-btn" style={{ display: "inline-flex" }}>{b.label}</span> <span className="nc-sub">→ {b.url || `/${b.page}`}</span></p>;
      case "list": return <ul key={i}>{b.items.map((t, j) => <li key={j}>{t}</li>)}</ul>;
      case "imageList": return <div key={i} style={{ display: "flex", gap: 6, overflowX: "auto" }}>{b.urls.map((u) => <img key={u} src={u} alt="" style={{ height: 90, borderRadius: 6 }} />)}</div>;
      case "table": return <table key={i} className="dt-table"><tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{c}</td>)}</tr>)}</tbody></table>;
      case "map": return <p key={i}>📍 {b.label || "Map"} ({b.lat}, {b.lng})</p>;
      default: return null;
    }
  });
}
