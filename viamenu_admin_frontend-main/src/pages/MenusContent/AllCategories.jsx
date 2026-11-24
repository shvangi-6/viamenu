import { useState } from "react";
import { FaFolderOpen, FaUtensils, FaEdit, FaTrash } from "react-icons/fa";
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
import RecordModal from "../../components/common/RecordModal";
import { confirmDelete } from "../../utils/confirmDelete";
import { countColumn } from "../AllRestaurants/restaurantColumns";

export default function AllCategories() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounce(searchInput);
  // No saved sort = the menu's own hierarchy order (parents before children).
  const sort = useSortState("content-categories", "name", "asc");
  const [editing, setEditing] = useState(null);

  const params = { page, limit: 10, sortBy: sort.sortBy, sortOrder: sort.sortOrder, ...(search && { search }) };
  const { data: categories, loading, metadata, refetch } = useDataFetch("/admin/content/categories", "categories", params);

  const columns = [
    {
      key: "name",
      label: "Category",
      sort: "name",
      render: (_v, c) => (
        <div className="nc">
          <div className="av av--md av--square" style={{ background: "#06b6d4" }}><FaFolderOpen /></div>
          <div className="nc-body">
            <span className="nc-name">{c.name}</span>
            {c.parentName && <span className="nc-sub">↳ Subcategory of {c.parentName}</span>}
          </div>
        </div>
      ),
    },
    { key: "menuName", label: "Menu" },
    { key: "restaurantName", label: "Restaurant" },
    countColumn("dishCount", "Dishes", undefined, "orange"),
    { key: "isActive", label: "Status", render: (v) => <StatusBadge status={v ? "active" : "inactive"} /> },
    { key: "createdAt", label: "Created", sort: "createdAt", render: (v) => fmtDate(v) },
    {
      key: "actions",
      label: "Actions",
      render: (_v, c) => (
        <div className="act-row">
          <button className="act-btn act-btn--ghost" onClick={() => navigate(`/restaurants/${c.restaurantId}/menus/${c.menuId}/categories/${c.id}/dishes`)} title="Dishes">
            <FaUtensils />
          </button>
          <button className="act-btn act-btn--ghost" onClick={() => setEditing(c)} title="Edit"><FaEdit /></button>
          <button className="act-btn act-btn--danger" onClick={() => confirmDelete(`/admin/content/categories/${c.id}`, `Delete the category "${c.name}" and its sub-categories?`, refetch)} title="Delete"><FaTrash /></button>
        </div>
      ),
    },
  ];

  return (
    <PageShell
      title="All Categories"
      subtitle={`${metadata.total_records} categories across all menus`}
      stats={<StatsCard icon={FaFolderOpen} label="Total Categories" value={metadata.total_records} color="#06b6d4" />}
    >
      <FilterBar
        search={searchInput}
        onSearch={(v) => { setSearchInput(v); setPage(1); }}
        placeholder="Search categories…"
        onReset={() => { setSearchInput(""); sort.resetSort(); setPage(1); }}
      />
      <DataTable onRowClick={(c) => navigate(`/restaurants/${c.restaurantId}/menus/${c.menuId}/categories/${c.id}/dishes`)} columns={columns} data={categories} loading={loading} sort={sort} emptyText="No categories found" />
      <Pagination metadata={metadata} onPageChange={setPage} />
      {editing && (
        <RecordModal
          title={`Edit category — ${editing.name}`}
          url={`/admin/content/categories/${editing.id}`}
          initial={editing}
          fields={[
            { key: "name", label: "Name", required: true },
            { key: "description", label: "Description", type: "textarea" },
            { key: "isActive", label: "Shown in the app", type: "checkbox" },
          ]}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}
    </PageShell>
  );
}
