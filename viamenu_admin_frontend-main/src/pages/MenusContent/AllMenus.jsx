import { useState } from "react";
import { FaBook, FaBookOpen, FaFolderOpen, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import PageShell from "../../components/common/PageShell";
import StatsCard from "../../components/common/StatsCard";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import { useDataFetch, useDebounce } from "../../hooks/useDataFetch";
import { useSortState } from "../../hooks/useSortState";
import { fmtDate } from "../../utils/fmtDate";
import { countColumn } from "../AllRestaurants/restaurantColumns";
import { displayName } from "../../utils/displayName";
import RecordModal from "../../components/common/RecordModal";
import { confirmDelete } from "../../utils/confirmDelete";

export default function AllMenus() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounce(searchInput);
  const sort = useSortState("content-menus", "name", "asc");
  const [editing, setEditing] = useState(null);

  const params = {
    page, limit: 10, sortBy: sort.sortBy, sortOrder: sort.sortOrder,
    ...(search && { search }), ...(statusFilter && { status: statusFilter }),
  };
  const { data: menus, loading, metadata, refetch } = useDataFetch("/admin/content/menus", "menus", params);

  const columns = [
    {
      key: "name",
      label: "Menu Name",
      sort: "name",
      render: (_v, m) => (
        <div className="nc">
          <div className="av av--md av--square" style={{ background: "#6366f1" }}><FaBook /></div>
          <span className="nc-name">{m.name}</span>
        </div>
      ),
    },
    { key: "restaurantName", label: "Restaurant" },
    {
      key: "owner",
      label: "Owner",
      render: (_v, m) => (
        <div className="nc-body">
          <span>{displayName(m.owner) || "—"}</span>
          {m.owner?.email && <span className="nc-sub">{m.owner.email}</span>}
        </div>
      ),
    },
    { key: "published", label: "Status", sort: "published", render: (v) => <StatusBadge status={v} /> },
    countColumn("categoryCount", "Categories", undefined, "blue"),
    countColumn("dishCount", "Dishes", undefined, "orange"),
    { key: "createdAt", label: "Created", sort: "createdAt", render: (v) => fmtDate(v) },
    {
      key: "actions",
      label: "Actions",
      render: (_v, m) => (
        <div className="act-row">
          <button className="act-btn act-btn--ghost" onClick={() => navigate(`/restaurants/${m.restaurantId}/menus/${m.id}/categories`)} title="Categories">
            <FaFolderOpen />
          </button>
          <button className="act-btn act-btn--ghost" onClick={() => setEditing(m)} title="Edit"><FaEdit /></button>
          <button className="act-btn act-btn--danger" onClick={() => confirmDelete(`/admin/content/menus/${m.id}`, `Delete the menu "${m.name}" with its categories and dishes? If it was the last published menu, the restaurant goes offline.`, refetch)} title="Delete"><FaTrash /></button>
        </div>
      ),
    },
  ];

  return (
    <PageShell
      title="All Menus"
      subtitle={`${metadata.total_records} menus across all restaurants`}
      stats={
        <>
          <StatsCard icon={FaBook}     label="Total Menus"       value={metadata.total_records} color="#6366f1" />
          <StatsCard icon={FaBookOpen} label="Published (page)"  value={menus.filter((m) => m.published === "PUBLISH").length} color="#22c55e" />
        </>
      }
    >
      <FilterBar
        search={searchInput}
        onSearch={(v) => { setSearchInput(v); setPage(1); }}
        placeholder="Search menus…"
        filters={[
          {
            key: "status",
            value: statusFilter,
            placeholder: "All Status",
            onChange: (v) => { setStatusFilter(v); setPage(1); },
            options: [
              { value: "PUBLISH", label: "Published" },
              { value: "DRAFT", label: "Draft" },
            ],
          },
        ]}
        onReset={() => { setSearchInput(""); setStatusFilter(""); sort.resetSort(); setPage(1); }}
      />
      <DataTable onRowClick={(m) => navigate(`/restaurants/${m.restaurantId}/menus/${m.id}/categories`)} columns={columns} data={menus} loading={loading} sort={sort} emptyText="No menus found" />
      <Pagination metadata={metadata} onPageChange={setPage} />
      {editing && (
        <RecordModal
          title={`Edit menu — ${editing.name}`}
          url={`/admin/content/menus/${editing.id}`}
          initial={editing}
          fields={[
            { key: "name", label: "Name", required: true },
            { key: "description", label: "Description", type: "textarea" },
            { key: "published", label: "Status", type: "select", options: [{ value: "DRAFT", label: "Draft" }, { value: "PUBLISH", label: "Published" }], hint: "Publishing uses the same checks as the app (the menu needs dishes)." },
          ]}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}
    </PageShell>
  );
}
