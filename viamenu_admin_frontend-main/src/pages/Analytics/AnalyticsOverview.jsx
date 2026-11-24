import React, { useState, useEffect } from "react";
import { FaChartBar, FaUsers, FaStore, FaBook, FaUtensils, FaArrowUp, FaArrowDown, FaEye, FaQrcode } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../utils/axiosInstance";
import StatsCard from "../../components/common/StatsCard";
import "./AnalyticsOverview.css";
import { ENTITY_COLORS as C } from "../../utils/entityColors";

const today = () => new Date().toISOString().split("T")[0];
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

export default function AnalyticsOverview() {
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo]     = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [views, setViews] = useState(null);

  useEffect(() => { fetchData(); }, [from, to]);

  // Guest views (restaurant/menu/dish/QR scans) for the same window.
  useEffect(() => {
    const days = Math.max(1, Math.round((new Date(to) - new Date(from)) / 864e5) + 1);
    axiosInstance.get("/admin/analytics/views", { params: { days } }).then((r) => setViews(r.data.data)).catch(() => setViews(null));
  }, [from, to]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/analytics/overview", { params: { from, to } });
      if (res.data.statusCode === 200 && res.data.data) {
        setData(res.data.data);
      }
    } catch (e) {
      toast.error("Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ao-page">
      <div className="ao-header">
        <div>
          <h1 className="ao-title">Analytics Overview</h1>
          <p className="ao-subtitle">Platform growth metrics</p>
        </div>
        <div className="ao-date-range">
          <label>From</label>
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="ao-date-input" />
          <label>To</label>
          <input type="date" value={to} min={from} max={today()} onChange={(e) => setTo(e.target.value)} className="ao-date-input" />
        </div>
      </div>

      {loading ? (
        <div className="ao-loading"><div className="ao-spinner" /></div>
      ) : data ? (
        <>
          <div className="ao-stats">
            <StatsCard icon={FaUsers}    label="New Users"       value={data.newUsers}       color={C.users} />
            <StatsCard icon={FaStore}    label="New Restaurants" value={data.newRestaurants}  color={C.restaurants} />
            <StatsCard icon={FaBook}     label="New Menus"       value={data.newMenus}        color={C.menus} />
            <StatsCard icon={FaUtensils} label="New Dishes"      value={data.newDishes}       color={C.dishes} />
          </div>

          <div className="ao-tables">
            <div className="ao-table-card">
              <h3 className="ao-table-title">Daily User Registrations</h3>
              {data.userGrowth?.length === 0 ? (
                <div className="ao-no-data">No data for this period</div>
              ) : (
                <table className="ao-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>New Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.userGrowth || []).map((row) => (
                      <tr key={row.date}>
                        <td>{row.date}</td>
                        <td>
                          <div className="ao-bar-row">
                            <div className="ao-bar" style={{ width: `${Math.min(100, (row.count / Math.max(...(data.userGrowth.map((r) => r.count)), 1)) * 100)}%` }} />
                            <span>{row.count}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="ao-table-card">
              <h3 className="ao-table-title">Daily Restaurant Sign-ups</h3>
              {data.restaurantGrowth?.length === 0 ? (
                <div className="ao-no-data">No data for this period</div>
              ) : (
                <table className="ao-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>New Restaurants</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.restaurantGrowth || []).map((row) => (
                      <tr key={row.date}>
                        <td>{row.date}</td>
                        <td>
                          <div className="ao-bar-row">
                            <div className="ao-bar ao-bar--blue" style={{ width: `${Math.min(100, (row.count / Math.max(...(data.restaurantGrowth.map((r) => r.count)), 1)) * 100)}%` }} />
                            <span>{row.count}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {views && (
            <>
              <div className="ao-stats" style={{ marginTop: 20 }}>
                <StatsCard icon={FaStore}  label="Restaurant views" value={views.byKind.RESTAURANT ?? 0} color={C.restaurants} />
                <StatsCard icon={FaBook}   label="Menu views"       value={views.byKind.MENU ?? 0}       color={C.menus} />
                <StatsCard icon={FaEye}    label="Dish views"       value={views.byKind.DISH ?? 0}       color={C.dishes} />
                <StatsCard icon={FaQrcode} label="QR scans"         value={views.byKind.QR_SCAN ?? 0}    color="#64748b" />
              </div>
              <div className="ao-tables">
                <div className="ao-table-card">
                  <h3 className="ao-table-title">Most viewed restaurants</h3>
                  {views.topRestaurants.length === 0 ? <div className="ao-no-data">No guest views yet</div> : (
                    <table className="ao-table">
                      <thead><tr><th>Restaurant</th><th>Views</th></tr></thead>
                      <tbody>{views.topRestaurants.map((r) => <tr key={r.restaurantId}><td>{r.name}</td><td>{r.views}</td></tr>)}</tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
