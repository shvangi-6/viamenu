import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaToggleOn, FaToggleOff } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../utils/axiosInstance";
import { useDataFetch, useDebounce } from "../../hooks/useDataFetch";
import PageShell from "../../components/common/PageShell";
import Breadcrumb from "../../components/common/Breadcrumb";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import StatsCard from "../../components/common/StatsCard";
import "../../components/common/shared.css";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function MenuCategories() {
  const { ownerId, restaurantId, menuId } = useParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState({});
  const search = useDebounce(searchInput);

  const { data: menus } = useDataFetch("/admin/content/menus", "menus", {
    page: 1, limit: 1, restaurantId,
  });
  const menu = menus?.find?.((m) => m.id === menuId) || menus?.[0] || null;
  const menuName = menu?.name || "Menu";
  const restaurantName = menu?.restaurantName || "Restaurant";

  const params = {
    page, limit: 15, menuId, restaurantId,
    ...(search && { search }),
  };
  const { data: categories, loading, metadata, refetch } = useDataFetch(
    "/admin/content/categories", "categories", params
  );

  const toggleCategoryStatus = async (category) => {
    const key = category.id;
    setActionLoading((p) => ({ ...p, [key]: true }));
    try {
      const res = await axiosInstance.patch(`/admin/content/categories/${category.id}/toggle-status`);
      if (res.data.statusCode === 200) {
        toast.success(`"${category.name}" ${res.data.data.isActive ? "shown" : "hidden"} in app`);
        refetch();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading((p) => { const n = { ...p }; delete n[key]; return n; });
    }
  };

  const columns = [
    {
      key: "name",
      label: "Category",
      render: (val, row) => (
        <div className="nc" style={{ paddingLeft: (row.level || 0) * 28 }}>
          {row.level > 0 && <span className="mc-tree-connector">↳</span>}
          <div className="av av--sm" style={{ background: row.level > 0 ? "#c4b5fd" : "#8b5cf6" }}>📁</div>
          <div className="nc-body">
            <span className="nc-name">{val}</span>
            {row.parentName && <span className="nc-sub">in {row.parentName}</span>}
          </div>
        </div>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (val) => (
        <span
          className="hero-pill"
          style={
            val
              ? { background: "var(--c-primary-lt)", color: "var(--c-primary)" }
              : { background: "#f1f5f9", color: "var(--c-muted)" }
          }
        >
          {val ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "dishCount",
      label: "Dishes",
      render: (val) => <span className="count-badge count-badge--orange">{val ?? 0}</span>,
    },
    {
      key: "createdAt",
      label: "Created",
      render: (val) => fmt(val),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_val, row) => (
        <button
          className={`mc-toggle-btn ${row.isActive ? "active" : ""}`}
          onClick={(e) => { e.stopPropagation(); toggleCategoryStatus(row); }}
          disabled={!!actionLoading[row.id]}
          title={row.isActive ? "Hide in app" : "Show in app"}
        >
          {actionLoading[row.id]
            ? <span className="mc-mini-spin" />
            : row.isActive ? <FaToggleOn /> : <FaToggleOff />}
        </button>
      ),
    },
  ];

  const crumbs = [
    ...(ownerId
      ? [
          { label: "Owners", to: "/users/owners" },
          { label: "Restaurants", to: `/owners/${ownerId}/restaurants` },
        ]
      : [{ label: "Restaurants", to: "/restaurant/restaurants-list" }]),
    {
      label: `${restaurantName} — Menus`,
      to: ownerId
        ? `/owners/${ownerId}/restaurants/${restaurantId}/menus`
        : `/restaurants/${restaurantId}/menus`,
    },
    { label: `${menuName} — Categories` },
  ];

  return (
    <PageShell
      title={`${menuName} — Categories`}
      subtitle={`${metadata.total_records} categor${metadata.total_records !== 1 ? "ies" : "y"}`}
      stats={
        <StatsCard icon={() => "📁"} label="Total Categories" value={metadata.total_records} color="#8b5cf6" />
      }
    >
      <div style={{ padding: "16px 20px 0" }}>
        <Breadcrumb crumbs={crumbs} />
        <FilterBar
          search={searchInput}
          onSearch={(v) => { setSearchInput(v); setPage(1); }}
          onReset={() => { setSearchInput(""); setPage(1); }}
        />
      </div>
      <DataTable
        columns={columns}
        data={categories}
        loading={loading}
        emptyText="No categories in this menu"
        onRowClick={(row) =>
          navigate(
            ownerId
              ? `/owners/${ownerId}/restaurants/${restaurantId}/menus/${menuId}/categories/${row.id}/dishes`
              : `/restaurants/${restaurantId}/menus/${menuId}/categories/${row.id}/dishes`
          )
        }
      />
      <Pagination metadata={metadata} onPageChange={setPage} />
    </PageShell>
  );
}
