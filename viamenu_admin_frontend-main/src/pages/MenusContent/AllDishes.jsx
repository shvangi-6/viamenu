import { useState } from "react";
import { FaUtensils, FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import PageShell from "../../components/common/PageShell";
import StatsCard from "../../components/common/StatsCard";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import { useDataFetch, useDebounce } from "../../hooks/useDataFetch";
import { useSortState } from "../../hooks/useSortState";
import { fmtDate } from "../../utils/fmtDate";
import { formatGermanPrice } from "../../utils/germanPrice";
import RecordModal from "../../components/common/RecordModal";
import { confirmDelete } from "../../utils/confirmDelete";

export default function AllDishes() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounce(searchInput);
  const sort = useSortState("content-dishes", "name", "asc");
  const [editing, setEditing] = useState(null);

  const params = { page, limit: 10, sortBy: sort.sortBy, sortOrder: sort.sortOrder, ...(search && { search }) };
  const { data: dishes, loading, metadata, refetch } = useDataFetch("/admin/content/dishes", "dishes", params);

  const avgPrice = dishes.length
    ? (dishes.reduce((s, d) => s + Number(d.singlePrice || 0), 0) / dishes.length).toFixed(2)
    : "0.00";

  const columns = [
    {
      key: "name",
      label: "Dish",
      sort: "name",
      render: (_v, d) => (
        <div className="nc">
          <div
            className="av av--md av--square"
            style={d.coverImage ? { backgroundImage: `url(${d.coverImage})` } : { background: "#ec4899" }}
          >
            {!d.coverImage && <FaUtensils />}
          </div>
          <span className="nc-name">{d.name}</span>
        </div>
      ),
    },
    { key: "restaurantName", label: "Restaurant" },
    { key: "menuName", label: "Menu" },
    { key: "categoryName", label: "Category" },
    {
      key: "singlePrice",
      label: "Price",
      sort: "singlePrice",
      render: (v) => <span className="price">€{Number(v || 0).toFixed(2)}</span>,
    },
    { key: "createdAt", label: "Created", sort: "createdAt", render: (v) => fmtDate(v) },
    {
      key: "actions",
      label: "Actions",
      render: (_v, d) => (
        <div className="act-row">
          <button className="act-btn act-btn--ghost" onClick={() => navigate(`/dishes/${d.id}/details`)} title="Details">
            <FaEye />
          </button>
          <button className="act-btn act-btn--ghost" onClick={() => setEditing({ ...d, singlePrice: formatGermanPrice(d.singlePrice), number: d.number ?? "" })} title="Edit"><FaEdit /></button>
          <button className="act-btn act-btn--danger" onClick={() => confirmDelete(`/admin/content/dishes/${d.id}`, `Delete the dish "${d.name}"?`, refetch)} title="Delete"><FaTrash /></button>
        </div>
      ),
    },
  ];

  return (
    <PageShell
      title="All Dishes"
      subtitle={`${metadata.total_records} dishes across all restaurants`}
      stats={
        <>
          <StatsCard icon={FaUtensils} label="Total Dishes"     value={metadata.total_records} color="#ec4899" />
          <StatsCard icon={FaUtensils} label="Avg Price (page)" value={`€${avgPrice}`}         color="#2c8769" />
        </>
      }
    >
      <FilterBar
        search={searchInput}
        onSearch={(v) => { setSearchInput(v); setPage(1); }}
        placeholder="Search dishes…"
        onReset={() => { setSearchInput(""); sort.resetSort(); setPage(1); }}
      />
      <DataTable onRowClick={(d) => navigate(`/dishes/${d.id}/details`)} columns={columns} data={dishes} loading={loading} sort={sort} emptyText="No dishes found" />
      <Pagination metadata={metadata} onPageChange={setPage} />
      {editing && (
        <RecordModal
          title={`Edit dish — ${editing.name}`}
          url={`/admin/content/dishes/${editing.id}`}
          initial={editing}
          fields={[
            { key: "name", label: "Name", required: true },
            { key: "description", label: "Description", type: "textarea" },
            { key: "singlePrice", label: "Price (€)", placeholder: "0,00", hint: "e.g. 12,50" },
            { key: "number", label: "Dish number", type: "number" },
            { key: "visibleInMenu", label: "Visible in menu", type: "checkbox" },
            { key: "canBeOrdered", label: "Can be ordered", type: "checkbox" },
            { key: "canBeDelivered", label: "Delivery", type: "checkbox" },
          ]}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}
    </PageShell>
  );
}
