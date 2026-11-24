import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../utils/axiosInstance";
import { useDataFetch, useDebounce } from "../../hooks/useDataFetch";
import PageShell from "../../components/common/PageShell";
import Breadcrumb from "../../components/common/Breadcrumb";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import StatsCard from "../../components/common/StatsCard";
import Pagination from "../../components/common/Pagination";
import StatusBadge from "../../components/common/StatusBadge";
import "../../components/common/shared.css";
import { displayName } from "../../utils/displayName";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function OwnerRestaurants() {
  const { ownerId } = useParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [owner, setOwner] = useState(null);
  const search = useDebounce(searchInput);

  useEffect(() => {
    axiosInstance.get(`/admin/users/${ownerId}`)
      .then((res) => setOwner(res.data?.data || null))
      .catch(() => setOwner(null));
  }, [ownerId]);

  const params = {
    page, limit: 15, ownerId,
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
  };
  const { data: restaurants, loading, metadata } = useDataFetch(
    "/admin/restaurant/all", "restaurants", params
  );

  const ownerName = displayName(owner) || "Owner";

  const columns = [
    {
      key: "name",
      label: "Restaurant",
      render: (val, row) => (
        <div className="nc">
          <div
            className="av av--md av--square"
            style={
              row.coverImage
                ? { backgroundImage: `url(${row.coverImage})`, backgroundColor: "transparent" }
                : { background: "var(--c-primary)" }
            }
          >
            {!row.coverImage && (val?.[0] || "R").toUpperCase()}
          </div>
          <div className="nc-body">
            <span className="nc-name">{val || "—"}</span>
            <span className="nc-sub">{row.email || ""}</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: "menuCount",
      label: "Menus",
      render: (val) => (
        <span className="count-badge count-badge--green">{val ?? 0}</span>
      ),
    },
    {
      key: "dishCount",
      label: "Dishes",
      render: (val) => (
        <span className="count-badge count-badge--blue">{val ?? 0}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (val) => fmt(val),
    },
  ];

  return (
    <PageShell
      title={`${ownerName}'s Restaurants`}
      subtitle={`${metadata.total_records} restaurant${metadata.total_records !== 1 ? "s" : ""}`}
      stats={
        <>
          <StatsCard icon={() => "🏪"} label="Total" value={metadata.total_records} color="#2c8769" />
        </>
      }
    >
      <div style={{ padding: "16px 20px 0" }}>
        <Breadcrumb
          crumbs={[
            { label: "Owners", to: "/users/owners" },
            { label: `${ownerName}'s Restaurants` },
          ]}
        />
        <FilterBar
          search={searchInput}
          onSearch={(v) => { setSearchInput(v); setPage(1); }}
          filters={[
            {
              key: "status",
              placeholder: "All Status",
              value: statusFilter,
              onChange: (v) => { setStatusFilter(v); setPage(1); },
              options: [
                { value: "PUBLISH", label: "Published" },
                { value: "DRAFT", label: "Draft" },
              ],
            },
          ]}
          onReset={() => { setSearchInput(""); setStatusFilter(""); setPage(1); }}
        />
      </div>
      <DataTable
        columns={columns}
        data={restaurants}
        loading={loading}
        emptyText="No restaurants found for this owner"
        onRowClick={(row) => navigate(`/owners/${ownerId}/restaurants/${row.id}/menus`)}
      />
      <Pagination metadata={metadata} onPageChange={setPage} />
    </PageShell>
  );
}
