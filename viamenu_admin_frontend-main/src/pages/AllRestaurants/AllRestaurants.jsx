import React, { useEffect, useState } from "react";
import {
  FaCheckCircle, FaTimesCircle, FaMotorcycle, FaShoppingBag,
  FaQrcode, FaMapMarkerAlt, FaUtensils, FaBookOpen,
  FaToggleOn, FaToggleOff, FaStore, FaBroadcastTower, FaTruck, FaShieldAlt, FaEye,
} from "react-icons/fa";
import { MdVerified, MdOutlineStorefront } from "react-icons/md";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import PageShell from "../../components/common/PageShell";
import StatsCard from "../../components/common/StatsCard";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import { useSortState } from "../../hooks/useSortState";
import "../../components/common/shared.css";
import "./AllRestaurants.css";

export default function AllRestaurants() {
  const navigate = useNavigate();

  const [restaurants, setRestaurants]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [stats, setStats]               = useState({ total: 0, published: 0, verified: 0, withDelivery: 0 });
  const [metadata, setMetadata]         = useState({ total_records: 0, current_page: 1, per_page: 10, total_page: 1 });

  // Filters
  const [searchInput, setSearchInput]       = useState("");
  const [search, setSearch]                 = useState("");
  const [statusFilter, setStatusFilter]     = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("");
  const [cityFilter, setCityFilter]         = useState("");
  const sort = useSortState("restaurants", "name", "asc");
  const { sortBy, sortOrder } = sort;
  const [currentPage, setCurrentPage]       = useState(1);
  const perPage = 10;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setCurrentPage(1); }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { fetchRestaurants(); }, [currentPage, search, statusFilter, verifiedFilter, deliveryFilter, cityFilter, sortBy, sortOrder]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage, limit: perPage, sortBy, sortOrder,
        ...(search         && { search }),
        ...(statusFilter   && { status: statusFilter }),
        ...(verifiedFilter && { isVerified: verifiedFilter }),
        ...(deliveryFilter && { isDeliveryService: deliveryFilter }),
        ...(cityFilter     && { city: cityFilter }),
      };
      const res = await axiosInstance.get("/admin/restaurant/all", { params });
      if (res.data.statusCode === 200 && res.data.data) {
        setRestaurants(res.data.data.restaurants || []);
        setStats(res.data.data.stats || { total: 0, published: 0, verified: 0, withDelivery: 0 });
        setMetadata({
          total_records: res.data.data.total_records || 0,
          current_page:  res.data.data.current_page  || 1,
          per_page:      res.data.data.per_page       || perPage,
          total_page:    res.data.data.total_page     || 1,
        });
      } else {
        setRestaurants([]);
        setStats({ total: 0, published: 0, verified: 0, withDelivery: 0 });
      }
    } catch (err) {
      setRestaurants([]);
      if (err.response?.status !== 404) {
        toast.error(err.response?.data?.message || "Failed to fetch restaurants");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchInput(""); setSearch(""); setStatusFilter(""); setVerifiedFilter("");
    setDeliveryFilter(""); setCityFilter(""); sort.resetSort(); setCurrentPage(1);
  };

  const hasFilters = search || statusFilter || verifiedFilter || deliveryFilter || cityFilter;

  const toggleVerify = async (restaurant) => {
    const key = `verify-${restaurant.id}`;
    setActionLoading(p => ({ ...p, [key]: true }));
    try {
      const res = await axiosInstance.patch(`/admin/restaurant/${restaurant.id}/verify`);
      if (res.data.statusCode === 200) {
        const newVal = res.data.data.isVerified;
        setRestaurants(prev => prev.map(r => r.id === restaurant.id ? { ...r, isVerified: newVal } : r));
        setStats(prev => ({ ...prev, verified: prev.verified + (newVal ? 1 : -1) }));
        toast.success(`"${restaurant.name}" ${newVal ? "verified" : "unverified"} successfully`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(p => { const n = { ...p }; delete n[key]; return n; });
    }
  };

  const toggleStatus = async (restaurant) => {
    const key = `status-${restaurant.id}`;
    setActionLoading(p => ({ ...p, [key]: true }));
    const newStatus = restaurant.status === "PUBLISH" ? "DRAFT" : "PUBLISH";
    try {
      const res = await axiosInstance.patch(`/admin/restaurant/${restaurant.id}/status`, { status: newStatus });
      if (res.data.statusCode === 200) {
        setRestaurants(prev => prev.map(r => r.id === restaurant.id ? { ...r, status: newStatus } : r));
        setStats(prev => ({ ...prev, published: prev.published + (newStatus === "PUBLISH" ? 1 : -1) }));
        toast.success(`"${restaurant.name}" set to ${newStatus}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(p => { const n = { ...p }; delete n[key]; return n; });
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

  const columns = [
    {
      key: "name",
      label: "Restaurant",
      sort: "name",
      width: 220,
      render: (_val, r) => (
        <div className="ar-name-cell">
          <div className="ar-avatar" style={{ backgroundImage: r.coverImage ? `url(${r.coverImage})` : undefined }}>
            {!r.coverImage && (r.name?.charAt(0)?.toUpperCase() || "?")}
          </div>
          <div>
            <div className="ar-name">{r.name || "—"}</div>
            <div className="ar-contact">{r.email}</div>
            {r.phone && <div className="ar-contact">{r.phone}</div>}
          </div>
        </div>
      ),
    },
    {
      key: "owner",
      label: "Owner",
      width: 170,
      render: (_val, r) =>
        r.owner ? (
          <div className="ar-owner-cell">
            <div className="ar-owner-avatar">{r.owner.name?.charAt(0)?.toUpperCase() || "?"}</div>
            <div>
              <div className="ar-owner-name">{r.owner.name || "—"}</div>
              <div className="ar-owner-email">{r.owner.email}</div>
            </div>
          </div>
        ) : <span className="ar-muted">—</span>,
    },
    {
      key: "location",
      label: "Location",
      sort: "city",
      width: 130,
      render: (_val, r) =>
        (r.city || r.country) ? (
          <div className="ar-location">
            <FaMapMarkerAlt className="ar-loc-icon" />
            <span>{[r.city, r.country].filter(Boolean).join(", ")}</span>
          </div>
        ) : <span className="ar-muted">—</span>,
    },
    {
      key: "types",
      label: "Types",
      width: 150,
      render: (_val, r) => (
        <div className="ar-tags">
          {r.restaurantTypes?.slice(0, 2).map(t => (
            <span key={t.id} className="ar-tag type">{t.name}</span>
          ))}
          {r.businessTypes?.slice(0, 1).map(t => (
            <span key={t.id} className="ar-tag biz">{t.name}</span>
          ))}
          {r.cuisines?.slice(0, 1).map(t => (
            <span key={t.id} className="ar-tag cuisine">{t.name}</span>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sort: "status",
      render: (_val, r) => (
        <span className={`ar-status-badge ${r.status === "PUBLISH" ? "published" : "draft"}`}>
          {r.status === "PUBLISH" ? <FaBroadcastTower /> : <FaStore />}
          {r.status}
        </span>
      ),
    },
    {
      key: "verified",
      label: "Verified",
      sort: "isVerified",
      render: (_val, r) => (
        <>
          {r.isVerified
            ? <span className="ar-verified yes"><MdVerified /> Verified</span>
            : <span className="ar-verified no"><FaTimesCircle /> Unverified</span>}
          {r.hasQRCode && <span className="ar-qr-badge"><FaQrcode /> QR</span>}
        </>
      ),
    },
    {
      key: "services",
      label: "Services",
      sort: "isDeliveryService",
      width: 150,
      render: (_val, r) => {
        const shown = r.serviceTypes?.slice(0, 2) || [];
        const extra = (r.serviceTypes?.length || 0) - shown.length;
        return (
          <div className="ar-services">
            <span className={`ar-service ${r.isDeliveryService ? "on" : "off"}`} title="Delivery">
              <FaMotorcycle />
            </span>
            <span className={`ar-service ${r.isFoodPickUP ? "on" : "off"}`} title="Pickup">
              <FaShoppingBag />
            </span>
            {shown.map(s => (
              <span key={s.id} className="ar-service-label">{s.name}</span>
            ))}
            {extra > 0 && (
              <span className="ar-service-label" title={r.serviceTypes.slice(2).map(s => s.name).join(", ")}>
                +{extra}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "content",
      label: "Content",
      sort: "menuCount",
      render: (_val, r) => (
        <div className="ar-counts">
          <span className="ar-count menus" title="Menus">
            <FaBookOpen /> {r.menuCount}
          </span>
          <span className="ar-count dishes" title="Dishes">
            <FaUtensils /> {r.dishCount}
          </span>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      sort: "createdAt",
      render: (val) => <span className="ar-date">{formatDate(val)}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (_val, r) => (
        <div className="ar-actions">
          <button
            className="ar-btn view"
            onClick={() => navigate(`/restaurants/restaurant-details/${r.id}`)}
            title="View details"
          >
            <FaEye />
          </button>
          <button
            className="ar-btn menus-drill"
            onClick={() => navigate(`/restaurants/${r.id}/menus`)}
            title="View Menus"
          >
            <FaBookOpen />
          </button>
          <button
            className={`ar-btn verify ${r.isVerified ? "active" : ""}`}
            onClick={() => toggleVerify(r)}
            disabled={!!actionLoading[`verify-${r.id}`]}
            title={r.isVerified ? "Unverify" : "Verify"}
          >
            {actionLoading[`verify-${r.id}`]
              ? <span className="ar-mini-spin" />
              : r.isVerified ? <FaCheckCircle /> : <FaShieldAlt />}
          </button>
          <button
            className={`ar-btn status-toggle ${r.status === "PUBLISH" ? "published" : ""}`}
            onClick={() => toggleStatus(r)}
            disabled={!!actionLoading[`status-${r.id}`]}
            title={r.status === "PUBLISH" ? "Set to Draft" : "Publish"}
          >
            {actionLoading[`status-${r.id}`]
              ? <span className="ar-mini-spin" />
              : r.status === "PUBLISH" ? <FaToggleOn /> : <FaToggleOff />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageShell
      title="All Restaurants"
      subtitle="Manage and view all registered restaurants"
      stats={
        <>
          <StatsCard icon={MdOutlineStorefront} label="Total Restaurants" value={stats.total} color="#2c8769" />
          <StatsCard icon={FaBroadcastTower} label="Published" value={stats.published} color="#3b82f6" />
          <StatsCard icon={FaShieldAlt} label="Verified" value={stats.verified} color="#8b5cf6" />
          <StatsCard icon={FaTruck} label="With Delivery" value={stats.withDelivery} color="#f59e0b" />
        </>
      }
    >

      <FilterBar
        search={searchInput}
        onSearch={setSearchInput}
        placeholder="Search by name, email, phone or ID…"
        onReset={handleReset}
        filters={[
          {
            key: "status",
            value: statusFilter,
            placeholder: "All Status",
            onChange: (v) => { setStatusFilter(v); setCurrentPage(1); },
            options: [
              { value: "PUBLISH", label: "Published" },
              { value: "DRAFT", label: "Draft" },
            ],
          },
          {
            key: "verified",
            value: verifiedFilter,
            placeholder: "All Verified",
            onChange: (v) => { setVerifiedFilter(v); setCurrentPage(1); },
            options: [
              { value: "true", label: "Verified" },
              { value: "false", label: "Not Verified" },
            ],
          },
          {
            key: "delivery",
            value: deliveryFilter,
            placeholder: "All Delivery",
            onChange: (v) => { setDeliveryFilter(v); setCurrentPage(1); },
            options: [
              { value: "true", label: "Has Delivery" },
              { value: "false", label: "No Delivery" },
            ],
          },
        ]}
      >
        <input
          className="fb-select"
          style={{ cursor: "text" }}
          placeholder="Filter by city…"
          value={cityFilter}
          onChange={(e) => { setCityFilter(e.target.value); setCurrentPage(1); }}
        />
      </FilterBar>

      <DataTable onRowClick={(r) => navigate(`/restaurants/restaurant-details/${r.id}`)}
        columns={columns}
        data={restaurants}
        loading={loading}
        sort={{ ...sort, toggleSort: (col) => { sort.toggleSort(col); setCurrentPage(1); } }}
        className="ar-table"
        emptyText={hasFilters ? "No restaurants match your filters" : "No restaurants found"}
        minWidth="1100px"
      />

      <Pagination metadata={metadata} onPageChange={setCurrentPage} />
    </PageShell>
  );
}
