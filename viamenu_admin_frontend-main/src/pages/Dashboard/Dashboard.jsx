import React, { useEffect, useMemo, useState } from "react";
import {
  FaUsers, FaUserTie, FaUserCog, FaStore, FaBookOpen,
  FaUtensils, FaExclamationTriangle, FaCheckCircle,
  FaClock, FaTruck, FaLeaf, FaFlask, FaSyncAlt, FaChartLine,
  FaLayerGroup, FaRegCalendarAlt,
} from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import axiosInstance from "../../utils/axiosInstance";
import StatsCard from "../../components/common/StatsCard";
import "./Dashboard.css";
import { ENTITY_COLORS } from "../../utils/entityColors";
import { displayName } from "../../utils/displayName";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } } },
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
};
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "65%",
  plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } } },
};
const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
};

// One colour per entity, used by every card and chart on this page, so a
// colour always means the same thing (Categories used to share Draft's amber).
const C = ENTITY_COLORS;

const SectionTitle = ({ icon: Icon, label, color }) => (
  <div className="db-section-title">
    <span className="db-section-icon" style={{ background: `${color}1a`, color }}>
      <Icon />
    </span>
    {label}
    <span className="db-section-line" />
  </div>
);

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [growth, setGrowth] = useState(null);
  const [refreshSpin, setRefreshSpin] = useState(false);

  useEffect(() => {
    axiosInstance
      .get("/admin/dashboard/stats")
      .then((res) => { if (res.data.statusCode === 200) setStats(res.data.data); })
      .catch(() => toast.error("Failed to load dashboard stats"))
      .finally(() => setLoading(false));

    const to = new Date();
    const from = new Date(to.getTime() - 13 * 24 * 60 * 60 * 1000);
    axiosInstance
      .get("/admin/analytics/overview", {
        params: { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] },
      })
      .then((res) => { if (res.data.statusCode === 200) setGrowth(res.data.data); })
      .catch(() => {});
  }, []);

  const growthLabels = useMemo(() => {
    if (!growth?.period) return [];
    const labels = [];
    for (let d = new Date(growth.period.from); d <= new Date(growth.period.to); d.setDate(d.getDate() + 1)) {
      labels.push(d.toISOString().split("T")[0]);
    }
    return labels;
  }, [growth]);

  const lineData = useMemo(() => {
    const userByDate = Object.fromEntries((growth?.userGrowth || []).map((r) => [r.date, r.count]));
    const restByDate = Object.fromEntries((growth?.restaurantGrowth || []).map((r) => [r.date, r.count]));
    return {
      labels: growthLabels.map((d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })),
      datasets: [
        {
          label: "New Users",
          data: growthLabels.map((d) => userByDate[d] || 0),
          borderColor: C.users,
          backgroundColor: `${C.users}1a`,
          tension: 0.3,
          fill: true,
        },
        {
          label: "New Restaurants",
          data: growthLabels.map((d) => restByDate[d] || 0),
          borderColor: C.restaurants,
          backgroundColor: `${C.restaurants}1a`,
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [growth, growthLabels]);

  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  if (loading) {
    return (
      <div className="db-loading">
        <div className="db-spinner" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  if (!stats) return null;

  const { users, restaurants, content, nutrition, subscriptionPlans, recentOwners, incompleteRestaurants } = stats;

  const statusDoughnutData = {
    labels: ["Published", "Draft"],
    datasets: [
      {
        data: [restaurants?.published ?? 0, restaurants?.draft ?? 0],
        backgroundColor: [C.published, C.draft],
        borderWidth: 0,
      },
    ],
  };

  const contentBarData = {
    labels: ["Menus", "Categories", "Dishes"],
    datasets: [
      {
        label: "Count",
        data: [content?.totalMenus ?? 0, content?.totalCategories ?? 0, content?.totalDishes ?? 0],
        backgroundColor: [C.menus, C.categories, C.dishes],
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="db-page">

      {/* Hero */}
      <div className="db-hero">
        <div className="db-hero-blob db-hero-blob--1" />
        <div className="db-hero-blob db-hero-blob--2" />
        <div className="db-hero-content">
          <div>
            <p className="db-hero-greeting">{greeting()}, Admin 👋</p>
            <h1 className="db-title">ViaMenu 2.0 Dashboard</h1>
            <p className="db-subtitle">
              <FaRegCalendarAlt />
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
          <button
            className={`db-refresh-btn ${refreshSpin ? "spinning" : ""}`}
            onClick={() => { setRefreshSpin(true); window.location.reload(); }}
          >
            <FaSyncAlt /> Refresh
          </button>
        </div>
        <div className="db-hero-stats">
          <div className="db-hero-stat">
            <span className="db-hero-stat-value">{users?.total ?? 0}</span>
            <span className="db-hero-stat-label">Total Users</span>
          </div>
          <div className="db-hero-divider" />
          <div className="db-hero-stat">
            <span className="db-hero-stat-value">{restaurants?.total ?? 0}</span>
            <span className="db-hero-stat-label">Restaurants</span>
          </div>
          <div className="db-hero-divider" />
          <div className="db-hero-stat">
            <span className="db-hero-stat-value">{restaurants?.published ?? 0}</span>
            <span className="db-hero-stat-label">Published Restaurants</span>
          </div>
          <div className="db-hero-divider" />
          <div className="db-hero-stat">
            <span className="db-hero-stat-value">{content?.totalDishes ?? 0}</span>
            <span className="db-hero-stat-label">Dishes</span>
          </div>
        </div>
      </div>

      {/* Users Section */}
      <SectionTitle icon={FaUsers} label="Users" color={C.users} />
      <div className="db-stats-row">
        <StatsCard icon={FaUsers}   label="Total Users"      value={users?.total}      color={C.users} trend={users?.trend} sub="vs last 7 days" onClick={() => navigate("/users/list")} />
        <StatsCard icon={FaUserTie} label="Restaurant Owners" value={users?.owners}    color={C.users} onClick={() => navigate("/users/owners")} />
        <StatsCard icon={FaUserCog} label="Managers"          value={users?.managers}  color="#8b5cf6" onClick={() => navigate("/users/managers")} />
        <StatsCard icon={FaUsers}   label="New This Week"     value={users?.newThisWeek} color="#f59e0b" sub="Last 7 days" onClick={() => navigate("/users/list")} />
      </div>

      {/* Restaurants Section */}
      <SectionTitle icon={FaStore} label="Restaurants" color={C.restaurants} />
      <div className="db-stats-row">
        <StatsCard icon={FaStore}              label="Total"            value={restaurants?.total}            color={C.restaurants} trend={restaurants?.trend} sub="vs last 7 days" onClick={() => navigate("/restaurant/restaurants-list")} />
        <StatsCard icon={FaCheckCircle}        label="Published"        value={restaurants?.published}        color={C.published} onClick={() => navigate("/restaurant/published")} />
        <StatsCard icon={FaClock}              label="Draft"            value={restaurants?.draft}            color={C.draft} onClick={() => navigate("/restaurant/draft")} />
        <StatsCard icon={MdVerified}           label="Pending Verify"   value={restaurants?.pendingVerification} color="#ef4444" onClick={() => navigate("/restaurant/pending-verification")} />
        <StatsCard icon={FaTruck}              label="With Delivery"    value={restaurants?.withDelivery}     color="#0ea5e9" onClick={() => navigate("/restaurant/restaurants-list")} />
        <StatsCard icon={FaExclamationTriangle} label="No Menu Setup"   value={restaurants?.noMenu}          color="#dc2626" onClick={() => navigate("/restaurant/no-menu")} />
      </div>

      {/* Content Section */}
      <SectionTitle icon={FaLayerGroup} label="Menus" color={C.menus} />
      <div className="db-stats-row">
        <StatsCard icon={FaBookOpen}  label="Total Menus"       value={content?.totalMenus}       color={C.menus} trend={content?.menusTrend}      sub="vs last 7 days" onClick={() => navigate("/content/menus")} />
        <StatsCard icon={FaBookOpen}  label="Published Menus"   value={content?.publishedMenus}   color={C.menus} onClick={() => navigate("/content/menus")} />
        <StatsCard icon={FaUtensils}  label="Total Categories"  value={content?.totalCategories}  color={C.categories} trend={content?.categoriesTrend} sub="vs last 7 days" onClick={() => navigate("/content/categories")} />
        <StatsCard icon={FaUtensils}  label="Total Dishes"      value={content?.totalDishes}      color={C.dishes} trend={content?.dishesTrend}     sub="vs last 7 days" onClick={() => navigate("/content/dishes")} />
      </div>

      {/* Trends & Breakdown */}
      <SectionTitle icon={FaChartLine} label="Trends & Breakdown" color="#8b5cf6" />
      <div className="db-charts-grid">
        <div className="db-chart-card db-chart-card--wide">
          <h3 className="db-chart-title">Growth — Last 14 Days</h3>
          <div className="db-chart-canvas">
            {growth ? <Line data={lineData} options={lineOptions} /> : <div className="db-chart-empty">Loading…</div>}
          </div>
        </div>
        <div className="db-chart-card">
          <h3 className="db-chart-title">Restaurant Status</h3>
          <div className="db-chart-canvas">
            <Doughnut data={statusDoughnutData} options={doughnutOptions} />
          </div>
        </div>
        <div className="db-chart-card">
          <h3 className="db-chart-title">Content Breakdown</h3>
          <div className="db-chart-canvas">
            <Bar data={contentBarData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Bottom Grid: Nutrition + Plans + Tables */}
      <div className="db-bottom-grid">
        {/* Nutrition & Plans */}
        <div className="db-side-cards">
          <div className="db-mini-card">
            <div className="db-mini-card-title">Nutrition</div>
            <div className="db-mini-row db-mini-row--clickable" onClick={() => navigate("/nutrition/ingredients")}>
              <div className="db-mini-icon" style={{ background: "#dcfce7", color: "#22c55e" }}><FaLeaf /></div>
              <div className="db-mini-label">Ingredients</div>
              <div className="db-mini-value">{nutrition?.totalIngredients ?? 0}</div>
            </div>
            <div className="db-mini-row db-mini-row--clickable" onClick={() => navigate("/nutrition/allergens")}>
              <div className="db-mini-icon" style={{ background: "#fee2e2", color: "#ef4444" }}><FaExclamationTriangle /></div>
              <div className="db-mini-label">Allergens</div>
              <div className="db-mini-value">{nutrition?.totalAllergens ?? 0}</div>
            </div>
            <div className="db-mini-row db-mini-row--clickable" onClick={() => navigate("/nutrition/additives")}>
              <div className="db-mini-icon" style={{ background: "#e0f2fe", color: "#0ea5e9" }}><FaFlask /></div>
              <div className="db-mini-label">Additives</div>
              <div className="db-mini-value">{nutrition?.totalAdditives ?? 0}</div>
            </div>
          </div>

          <div className="db-mini-card">
            <div className="db-mini-card-title">Subscription Plans</div>
            <div className="db-mini-row db-mini-row--clickable" onClick={() => navigate("/subscription/plans")}>
              <div className="db-mini-icon" style={{ background: "#d1fae5", color: "#2c8769" }}><FaCheckCircle /></div>
              <div className="db-mini-label">Total Plans</div>
              <div className="db-mini-value">{subscriptionPlans?.total ?? 0}</div>
            </div>
            <div className="db-mini-row db-mini-row--clickable" onClick={() => navigate("/subscription/active")}>
              <div className="db-mini-icon" style={{ background: "#dbeafe", color: "#3b82f6" }}><FaCheckCircle /></div>
              <div className="db-mini-label">Active Plans</div>
              <div className="db-mini-value">{subscriptionPlans?.active ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Recent Owners */}
        <div className="db-table-card">
          <div className="db-table-header">
            <h3 className="db-table-title">Recently Joined Owners</h3>
            <button className="db-link-btn" onClick={() => navigate("/users/owners")}>View All</button>
          </div>
          {!recentOwners?.length ? (
            <div className="db-table-empty">No owners yet</div>
          ) : (
            <table className="db-table">
              <thead>
                <tr>
                  <th>Owner</th>
                  <th>Company</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentOwners.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="db-user-cell">
                        <div className="db-avatar db-avatar--green">
                          {(u.name?.[0] || "O").toUpperCase()}
                        </div>
                        <div>
                          <div className="db-user-name">{displayName(u) || "—"}</div>
                          <div className="db-user-email">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.companyName || "—"}</td>
                    <td>{fmt(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Incomplete Restaurants */}
        <div className="db-table-card db-table-card--alert">
          <div className="db-table-header">
            <h3 className="db-table-title">
              <FaExclamationTriangle className="db-alert-icon" />
              Needs Attention
            </h3>
            <button className="db-link-btn" onClick={() => navigate("/restaurant/no-menu")}>View All</button>
          </div>
          {!incompleteRestaurants?.length ? (
            <div className="db-table-empty db-table-empty--green">All restaurants properly set up</div>
          ) : (
            <table className="db-table">
              <thead>
                <tr>
                  <th>Restaurant</th>
                  <th>Owner</th>
                  <th>Issues</th>
                </tr>
              </thead>
              <tbody>
                {incompleteRestaurants.map((r) => (
                  <tr key={r.id} className="db-alert-row" onClick={() => navigate(`/restaurants/restaurant-details/${r.id}`)}>
                    <td>
                      <div className="db-user-cell">
                        <div className="db-avatar db-avatar--red">
                          {(r.name?.[0] || "R").toUpperCase()}
                        </div>
                        <div className="db-user-name">{r.name}</div>
                      </div>
                    </td>
                    <td>{displayName(r.owner) || "—"}</td>
                    <td>
                      <div className="db-issues">
                        {(r.issues || []).slice(0, 2).map((issue, i) => (
                          <span key={i} className="db-issue-tag">{issue}</span>
                        ))}
                        {r.issues?.length > 2 && <span className="db-issue-tag">+{r.issues.length - 2}</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
