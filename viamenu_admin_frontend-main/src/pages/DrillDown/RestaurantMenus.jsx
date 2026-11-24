import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { useDataFetch, useDebounce } from "../../hooks/useDataFetch";
import axiosInstance from "../../utils/axiosInstance";
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

export default function RestaurantMenus() {
  const { ownerId, restaurantId } = useParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounce(searchInput);

  const { data: restaurantArr, loading: rLoading } = useDataFetch(
    "/admin/restaurant/all", "restaurants", { page: 1, limit: 1, restaurantId }
  );
  const restaurant = restaurantArr?.[0] || null;

  const params = {
    page, limit: 15, restaurantId,
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
  };
  const { data: menus, loading, metadata } = useDataFetch("/admin/content/menus", "menus", params);

  const restaurantName = restaurant?.name || "Restaurant";
  const ownerName = displayName(restaurant?.owner) || "Owner";

  const columns = [
    {
      key: "name",
      label: "Menu Name",
      render: (val) => (
        <div className="nc">
          <div className="av av--sm" style={{ background: "#3b82f6" }}>📖</div>
          <div className="nc-body">
            <span className="nc-name">{val}</span>
          </div>
        </div>
      ),
    },
    {
      key: "published",
      label: "Status",
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: "categoryCount",
      label: "Categories",
      render: (val) => <span className="count-badge count-badge--green">{val ?? 0}</span>,
    },
    {
      key: "dishCount",
      label: "Dishes",
      render: (val) => <span className="count-badge count-badge--blue">{val ?? 0}</span>,
    },
    {
      key: "createdAt",
      label: "Created",
      render: (val) => fmt(val),
    },
  ];

  const crumbs = ownerId
    ? [
        { label: "Owners", to: "/users/owners" },
        { label: `${ownerName}'s Restaurants`, to: `/owners/${ownerId}/restaurants` },
        { label: `${restaurantName} — Menus` },
      ]
    : [
        { label: "Restaurants", to: "/restaurant/restaurants-list" },
        { label: `${restaurantName} — Menus` },
      ];

  return (
    <PageShell
      title={`${restaurantName} — Menus`}
      subtitle={`${metadata.total_records} menu${metadata.total_records !== 1 ? "s" : ""}`}
      stats={
        <StatsCard icon={() => "📖"} label="Total Menus" value={metadata.total_records} color="#3b82f6" />
      }
    >
      <div style={{ padding: "16px 20px 0" }}>
        <Breadcrumb crumbs={crumbs} />
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
        data={menus}
        loading={loading}
        emptyText="No menus for this restaurant"
        onRowClick={(row) =>
          navigate(
            ownerId
              ? `/owners/${ownerId}/restaurants/${restaurantId}/menus/${row.id}/categories`
              : `/restaurants/${restaurantId}/menus/${row.id}/categories`
          )
        }
      />
      <Pagination metadata={metadata} onPageChange={setPage} />
    </PageShell>
  );
}
