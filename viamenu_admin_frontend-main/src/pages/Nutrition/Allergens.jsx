import { useState } from "react";
import { FaExclamationCircle } from "react-icons/fa";
import PageShell from "../../components/common/PageShell";
import StatsCard from "../../components/common/StatsCard";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import { useDataFetch, useDebounce } from "../../hooks/useDataFetch";
import { useSortState } from "../../hooks/useSortState";
import { fmtDate } from "../../utils/fmtDate";
import { useNutritionManage } from "./useNutritionManage";

export default function Allergens() {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounce(searchInput);
  const sort = useSortState("nutrition-allergens", "name", "asc");

  const params = { page, limit: 10, sortBy: sort.sortBy, sortOrder: sort.sortOrder, ...(search && { search }) };
  const { data: allergens, loading, metadata, refetch } = useDataFetch("/admin/nutrition/allergens", "allergens", params);

  const manage = useNutritionManage("allergens", "allergen", refetch);

  const columns = [
    {
      key: "name",
      label: "Allergen",
      sort: "name",
      render: (_v, a) => (
        <div className="nc">
          <div className="av av--md av--square" style={{ background: "#ef4444" }}><FaExclamationCircle /></div>
          <span className="nc-name">{a.name}</span>
        </div>
      ),
    },
    { key: "description", label: "Description", render: (v) => v ? <span className="description-text" title={v}>{v}</span> : "—" },
    { key: "ownerName", label: "Owner" },
    { key: "createdAt", label: "Created", sort: "createdAt", render: (v) => fmtDate(v) },
    manage.actionColumn,
  ];

  return (
    <PageShell
      actions={manage.addButton}
      title="Allergens"
      subtitle={`${metadata.total_records} allergens in the system`}
      stats={<StatsCard icon={FaExclamationCircle} label="Total Allergens" value={metadata.total_records} color="#ef4444" />}
    >
      <FilterBar
        search={searchInput}
        onSearch={(v) => { setSearchInput(v); setPage(1); }}
        placeholder="Search allergens…"
        onReset={() => { setSearchInput(""); sort.resetSort(); setPage(1); }}
      />
      <DataTable columns={columns} data={allergens} loading={loading} sort={sort} emptyText="No allergens found" />
      <Pagination metadata={metadata} onPageChange={setPage} />
      {manage.modal}
    </PageShell>
  );
}
