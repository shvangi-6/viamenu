import { useState } from "react";
import { FaLayerGroup } from "react-icons/fa";
import PageShell from "../../components/common/PageShell";
import StatsCard from "../../components/common/StatsCard";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import { useDataFetch, useDebounce } from "../../hooks/useDataFetch";
import { useSortState } from "../../hooks/useSortState";
import { fmtDate } from "../../utils/fmtDate";
import { countColumn } from "../AllRestaurants/restaurantColumns";
import { displayName } from "../../utils/displayName";

export default function VariantSets() {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounce(searchInput);
  const sort = useSortState("content-variant-sets", "name", "asc");

  const params = { page, limit: 10, sortBy: sort.sortBy, sortOrder: sort.sortOrder, ...(search && { search }) };
  const { data: variantSets, loading, metadata } = useDataFetch("/admin/content/variant-sets", "variantSets", params);

  const columns = [
    {
      key: "name",
      label: "Name",
      sort: "name",
      render: (_v, s) => (
        <div className="nc">
          <div className="av av--md av--square" style={{ background: "#6366f1" }}><FaLayerGroup /></div>
          <span className="nc-name">{s.name}</span>
        </div>
      ),
    },
    { key: "displayMode", label: "Display Mode" },
    countColumn("variantCount", "Variants", undefined, "blue"),
    {
      key: "owner",
      label: "Owner",
      render: (_v, s) => (
        <div className="nc-body">
          <span>{displayName(s.owner) || "—"}</span>
          {s.owner?.email && <span className="nc-sub">{s.owner.email}</span>}
        </div>
      ),
    },
    { key: "createdAt", label: "Created", sort: "createdAt", render: (v) => fmtDate(v) },
  ];

  return (
    <PageShell
      title="Variant Sets"
      subtitle={`${metadata.total_records} variant sets created by restaurant owners`}
      stats={<StatsCard icon={FaLayerGroup} label="Total Variant Sets" value={metadata.total_records} color="#6366f1" />}
    >
      <FilterBar
        search={searchInput}
        onSearch={(v) => { setSearchInput(v); setPage(1); }}
        placeholder="Search variant sets…"
        onReset={() => { setSearchInput(""); sort.resetSort(); setPage(1); }}
      />
      <DataTable columns={columns} data={variantSets} loading={loading} sort={sort} emptyText="No variant sets found" />
      <Pagination metadata={metadata} onPageChange={setPage} />
    </PageShell>
  );
}
