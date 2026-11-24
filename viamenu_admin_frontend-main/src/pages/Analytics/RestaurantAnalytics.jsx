import React, { useEffect, useState } from "react";
import { FaStore, FaBook, FaUtensils, FaChartBar } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../utils/axiosInstance";
import StatsCard from "../../components/common/StatsCard";
import "./RestaurantAnalytics.css";
import { ENTITY_COLORS as C } from "../../utils/entityColors";

export default function RestaurantAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get("/admin/analytics/content")
      .then((res) => { if (res.data.statusCode === 200) setData(res.data.data); })
      .catch(() => toast.error("Failed to fetch content stats"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="ra-page">
      <div className="ra-header">
        <h1 className="ra-title">Restaurant Analytics</h1>
        <p className="ra-subtitle">Content distribution across all restaurants</p>
      </div>

      {loading ? (
        <div className="ra-loading"><div className="ra-spinner" /></div>
      ) : data ? (
        <>
          <div className="ra-stats">
            <StatsCard icon={FaBook}     label="Published Menus"       value={data.menusByStatus?.published ?? 0}   color={C.menus} />
            <StatsCard icon={FaBook}     label="Draft Menus"           value={data.menusByStatus?.draft ?? 0}       color={C.menus} />
            <StatsCard icon={FaUtensils} label="Avg Dishes/Restaurant" value={data.dishesPerRestaurant ?? 0}        color={C.dishes} />
            <StatsCard icon={FaChartBar} label="Avg Categories/Menu"   value={data.categoriesPerMenu ?? 0}          color={C.categories} />
          </div>

          <div className="ra-card">
            <h3 className="ra-card-title">Top 10 Restaurants by Dish Count</h3>
            {(data.topRestaurantsByDishes || []).length === 0 ? (
              <div className="ra-no-data">No data available</div>
            ) : (
              <table className="ra-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Restaurant</th>
                    <th>Dishes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topRestaurantsByDishes.map((r, i) => (
                    <tr key={r.id}>
                      <td className="ra-rank">{i + 1}</td>
                      <td>
                        <div className="ra-restaurant">
                          <div className="ra-avatar">{(r.name?.[0] || "R").toUpperCase()}</div>
                          <span>{r.name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="ra-bar-row">
                          <div className="ra-bar" style={{ width: `${(r.dishCount / (data.topRestaurantsByDishes[0]?.dishCount || 1)) * 100}%` }} />
                          <span className="ra-count">{r.dishCount}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
