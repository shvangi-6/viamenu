import React, { useEffect, useState } from "react";
import { FaBookOpen, FaFolderOpen, FaUtensils, FaBook } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../utils/axiosInstance";
import StatsCard from "../../components/common/StatsCard";
import "./ContentStats.css";
import { ENTITY_COLORS as C } from "../../utils/entityColors";

export default function ContentStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get("/admin/analytics/content")
      .then((res) => { if (res.data.statusCode === 200) setData(res.data.data); })
      .catch(() => toast.error("Failed to fetch content stats"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="cs-page">
      <div className="cs-header">
        <h1 className="cs-title">Content Statistics</h1>
        <p className="cs-subtitle">Platform-wide content overview</p>
      </div>

      {loading ? (
        <div className="cs-loading"><div className="cs-spinner" /></div>
      ) : data ? (
        <>
          <div className="cs-stats">
            <StatsCard icon={FaBook}       label="Total Menus"      value={data.totals?.menus ?? 0}      color={C.menus} />
            <StatsCard icon={FaFolderOpen} label="Total Categories" value={data.totals?.categories ?? 0} color={C.categories} />
            <StatsCard icon={FaUtensils}   label="Total Dishes"     value={data.totals?.dishes ?? 0}     color={C.dishes} />
          </div>

          <div className="cs-grid">
            <div className="cs-card">
              <h3 className="cs-card-title">Menu Status</h3>
              <div className="cs-donut-rows">
                <div className="cs-donut-row">
                  <div className="cs-dot cs-dot--published" />
                  <span>Published</span>
                  <strong>{data.menusByStatus?.published ?? 0}</strong>
                </div>
                <div className="cs-donut-row">
                  <div className="cs-dot cs-dot--draft" />
                  <span>Draft</span>
                  <strong>{data.menusByStatus?.draft ?? 0}</strong>
                </div>
              </div>
            </div>

            <div className="cs-card">
              <h3 className="cs-card-title">Averages</h3>
              <div className="cs-avg-grid">
                <div className="cs-avg">
                  <div className="cs-avg-value">{data.dishesPerRestaurant ?? 0}</div>
                  <div className="cs-avg-label">Avg Dishes per Restaurant</div>
                </div>
                <div className="cs-avg">
                  <div className="cs-avg-value">{data.categoriesPerMenu ?? 0}</div>
                  <div className="cs-avg-label">Avg Categories per Menu</div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
