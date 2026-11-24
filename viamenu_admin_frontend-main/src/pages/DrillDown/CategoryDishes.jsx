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

export default function CategoryDishes() {
  const { ownerId, restaurantId, menuId, categoryId } = useParams();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState({});
  const search = useDebounce(searchInput);

  const { data: categories } = useDataFetch("/admin/content/categories", "categories", {
    page: 1, limit: 1, menuId, restaurantId,
  });
  const category = categories?.find?.((c) => c.id === categoryId) || categories?.[0] || null;
  const categoryName = category?.name || "Category";
  const menuName = category?.menuName || "Menu";
  const restaurantName = category?.restaurantName || "Restaurant";

  const params = {
    page, limit: 15, categoryId, menuId, restaurantId,
    ...(search && { search }),
  };
  const { data: dishes, loading, metadata, refetch } = useDataFetch("/admin/content/dishes", "dishes", params);

  const toggleDishVisibility = async (dish) => {
    const key = dish.id;
    setActionLoading((p) => ({ ...p, [key]: true }));
    try {
      const res = await axiosInstance.patch(`/admin/content/dishes/${dish.id}/toggle-visibility`);
      if (res.data.statusCode === 200) {
        toast.success(`"${dish.name}" ${res.data.data.visibleInMenu ? "shown" : "hidden"} in app`);
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
      label: "Dish",
      render: (val, row) => (
        <div className="nc">
          <div
            className="av av--md av--square"
            style={
              row.coverImage
                ? { backgroundImage: `url(${row.coverImage})`, backgroundColor: "transparent" }
                : { background: "#f59e0b" }
            }
          >
            {!row.coverImage && "🍽"}
          </div>
          <div className="nc-body">
            <span className="nc-name">{val}</span>
            <span className="nc-sub">{row.categoryName || ""}</span>
          </div>
        </div>
      ),
    },
    {
      key: "singlePrice",
      label: "Price",
      render: (val) => (
        <span className="price">€{Number(val || 0).toFixed(2)}</span>
      ),
    },
    {
      key: "visibleInMenu",
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
          {val ? "Active" : "Hidden"}
        </span>
      ),
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
          className={`mc-toggle-btn ${row.visibleInMenu ? "active" : ""}`}
          onClick={(e) => { e.stopPropagation(); toggleDishVisibility(row); }}
          disabled={!!actionLoading[row.id]}
          title={row.visibleInMenu ? "Hide in app" : "Show in app"}
        >
          {actionLoading[row.id]
            ? <span className="mc-mini-spin" />
            : row.visibleInMenu ? <FaToggleOn /> : <FaToggleOff />}
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
    {
      label: `${menuName} — Categories`,
      to: ownerId
        ? `/owners/${ownerId}/restaurants/${restaurantId}/menus/${menuId}/categories`
        : `/restaurants/${restaurantId}/menus/${menuId}/categories`,
    },
    { label: `${categoryName} — Dishes` },
  ];

  return (
    <PageShell
      title={`${categoryName} — Dishes`}
      subtitle={`${metadata.total_records} dish${metadata.total_records !== 1 ? "es" : ""}`}
      stats={
        <StatsCard icon={() => "🍽"} label="Total Dishes" value={metadata.total_records} color="#f59e0b" />
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
        data={dishes}
        loading={loading}
        emptyText="No dishes in this category"
        onRowClick={(row) => navigate(`/dishes/${row.id}/details`)}
      />
      <Pagination metadata={metadata} onPageChange={setPage} />
    </PageShell>
  );
}
