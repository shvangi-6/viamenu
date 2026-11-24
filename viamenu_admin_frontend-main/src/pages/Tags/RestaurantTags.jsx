import { useState } from "react";
import { FaTags } from "react-icons/fa";
import PageShell from "../../components/common/PageShell";
import StatsCard from "../../components/common/StatsCard";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
import { useDataFetch, useDebounce } from "../../hooks/useDataFetch";
import { useSortState } from "../../hooks/useSortState";
import { fmtDate } from "../../utils/fmtDate";
import { tagNameColumn } from "./tagColumns";
import { displayName } from "../../utils/displayName";

export default function RestaurantTags() {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [ownerId, setOwnerId] = useState("");
  const search = useDebounce(searchInput);
  const sort = useSortState("tags-restaurant", "name", "asc");

  // type=own: custom tags owners created themselves (global ones are on Global Tags).
  const params = {
    page, limit: 10, type: "own", sortBy: sort.sortBy, sortOrder: sort.sortOrder,
    ...(search && { search }), ...(ownerId && { ownerId }),
  };
  const { data: tags, loading, metadata, raw } = useDataFetch("/admin/tags/list", "tags", params);

  const owners = raw?.filterOptions?.owners ?? [];

  const columns = [
    tagNameColumn,
    { key: "originalName", label: "Original Name" },
    {
      key: "owner",
      label: "Owner",
      render: (o) => o ? (
        <div className="nc-body">
          <span>{displayName(o) || "—"}</span>
          {o.email && <span className="nc-sub">{o.email}</span>}
        </div>
      ) : "—",
    },
    { key: "isActive", label: "Status", sort: "isActive", render: (v) => <StatusBadge status={v ? "active" : "inactive"} /> },
    { key: "createdAt", label: "Created", sort: "createdAt", render: (v) => fmtDate(v) },
  ];

  return (
    <PageShell
      title="Owner Tags"
      subtitle="Custom tags each owner creates for their own restaurants"
      stats={<StatsCard icon={FaTags} label="Owner Tags" value={metadata.total_records} color="#f59e0b" />}
    >
      <FilterBar
        search={searchInput}
        onSearch={(v) => { setSearchInput(v); setPage(1); }}
        placeholder="Search by tag, owner or restaurant…"
        filters={[
          {
            key: "owner", placeholder: "All Owners", value: ownerId,
            options: owners.map((o) => ({ value: o.id, label: displayName(o) })),
            onChange: (v) => { setOwnerId(v); setPage(1); },
          },
        ]}
        onReset={() => { setSearchInput(""); setOwnerId(""); sort.resetSort(); setPage(1); }}
      />
      <DataTable columns={columns} data={tags} loading={loading} sort={sort} emptyText="No owner tags found" />
      <Pagination metadata={metadata} onPageChange={setPage} />
    </PageShell>
  );
}
