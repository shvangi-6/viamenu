import { useState } from "react";
import { FaFlask } from "react-icons/fa";
import PageShell from "../../components/common/PageShell";
import StatsCard from "../../components/common/StatsCard";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import { useDataFetch, useDebounce } from "../../hooks/useDataFetch";
import { useSortState } from "../../hooks/useSortState";
import { fmtDate } from "../../utils/fmtDate";
import { useNutritionManage } from "./useNutritionManage";

export default function Additives() {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounce(searchInput);
  const sort = useSortState("nutrition-additives", "name", "asc");

  const params = { page, limit: 10, sortBy: sort.sortBy, sortOrder: sort.sortOrder, ...(search && { search }) };
  const { data: additives, loading, metadata, refetch } = useDataFetch("/admin/nutrition/additives", "additives", params);

  const manage = useNutritionManage("additives", "additive", refetch);

  const columns = [
    {
      key: "name",
      label: "Additive",
      sort: "name",
      render: (_v, a) => (
        <div className="nc">
          <div className="av av--md av--square" style={{ background: "#0ea5e9" }}><FaFlask /></div>
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
      title="Additives"
      subtitle={`${metadata.total_records} additives in the system`}
      stats={<StatsCard icon={FaFlask} label="Total Additives" value={metadata.total_records} color="#0ea5e9" />}
    >
      <FilterBar
        search={searchInput}
        onSearch={(v) => { setSearchInput(v); setPage(1); }}
        placeholder="Search additives…"
        onReset={() => { setSearchInput(""); sort.resetSort(); setPage(1); }}
      />
      <DataTable columns={columns} data={additives} loading={loading} sort={sort} emptyText="No additives found" />
      <Pagination metadata={metadata} onPageChange={setPage} />
      {manage.modal}
    </PageShell>
  );
}
