import { useState } from "react";
import { FaSeedling } from "react-icons/fa";
import PageShell from "../../components/common/PageShell";
import StatsCard from "../../components/common/StatsCard";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import { useDataFetch, useDebounce } from "../../hooks/useDataFetch";
import { useSortState } from "../../hooks/useSortState";
import { fmtDate } from "../../utils/fmtDate";
import { useNutritionManage } from "./useNutritionManage";
import { countColumn } from "../AllRestaurants/restaurantColumns";
import { displayName } from "../../utils/displayName";

export default function Ingredients() {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounce(searchInput);
  const sort = useSortState("nutrition-ingredients", "name", "asc");

  const params = { page, limit: 10, sortBy: sort.sortBy, sortOrder: sort.sortOrder, ...(search && { search }) };
  const { data: ingredients, loading, metadata, refetch } = useDataFetch("/admin/nutrition/ingredients", "ingredients", params);

  const manage = useNutritionManage("ingredients", "ingredient", refetch);

  const columns = [
    {
      key: "name",
      label: "Name",
      sort: "name",
      render: (_v, i) => (
        <div className="nc">
          <div className="av av--md av--square" style={{ background: "#22c55e" }}><FaSeedling /></div>
          <span className="nc-name">{i.name}</span>
        </div>
      ),
    },
    { key: "description", label: "Description", render: (v) => v ? <span className="description-text" title={v}>{v}</span> : "—" },
    countColumn("allergenCount", "Allergens", undefined, "orange"),
    countColumn("additiveCount", "Additives", undefined, "blue"),
    {
      key: "owner",
      label: "Owner",
      render: (_v, i) => (
        <div className="nc-body">
          <span>{displayName(i.owner) || "—"}</span>
          {i.owner?.email && <span className="nc-sub">{i.owner.email}</span>}
        </div>
      ),
    },
    { key: "createdAt", label: "Created", sort: "createdAt", render: (v) => fmtDate(v) },
    manage.actionColumn,
  ];

  return (
    <PageShell
      actions={manage.addButton}
      title="Ingredients"
      subtitle={`${metadata.total_records} ingredients in the system`}
      stats={<StatsCard icon={FaSeedling} label="Total Ingredients" value={metadata.total_records} color="#22c55e" />}
    >
      <FilterBar
        search={searchInput}
        onSearch={(v) => { setSearchInput(v); setPage(1); }}
        placeholder="Search ingredients…"
        onReset={() => { setSearchInput(""); sort.resetSort(); setPage(1); }}
      />
      <DataTable columns={columns} data={ingredients} loading={loading} sort={sort} emptyText="No ingredients found" />
      <Pagination metadata={metadata} onPageChange={setPage} />
      {manage.modal}
    </PageShell>
  );
}
