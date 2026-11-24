import React, { useState } from "react";
import { rowClick } from "../../utils/rowClick";
import { FaBook, FaEye } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { useDataFetch } from "../../hooks/useDataFetch";
import StatsCard from "../../components/common/StatsCard";
import Pagination from "../../components/common/Pagination";
import "./EmptyMenus.css";
import { displayName } from "../../utils/displayName";

export default function EmptyMenus() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: menus, loading, metadata } = useDataFetch(
    "/admin/moderation/empty-menus", "menus", { page, limit: 10 }
  );

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";

  return (
    <div className="em-page">
      <div className="em-header">
        <h1 className="em-title">Empty Menus</h1>
        <p className="em-subtitle">Published menus with no dishes</p>
      </div>
      <div className="em-stats">
        <StatsCard icon={FaBook} label="Empty Published Menus" value={metadata.total_records} color="#ef4444" />
      </div>
      <div className="em-table-wrap">
        {loading ? (
          <div className="em-loader"><div className="em-spinner" /></div>
        ) : menus.length === 0 ? (
          <div className="em-empty">No empty published menus found</div>
        ) : (
          <table className="em-table">
            <thead>
              <tr>
                <th>Menu</th>
                <th>Restaurant</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((m) => (
                <tr key={m.id} className="dt-row--clickable" onClick={rowClick(() => navigate(`/restaurants/restaurant-details/${m.restaurantId}`))}>
                  <td>
                    <div className="em-menu">
                      <div className="em-icon"><FaBook /></div>
                      <span className="em-name">{m.name}</span>
                    </div>
                  </td>
                  <td>{m.restaurantName || "—"}</td>
                  <td>
                    <div>{displayName(m.owner) || "—"}</div>
                    <div className="em-sub">{m.owner?.email || ""}</div>
                  </td>
                  <td><span className="em-badge">{m.published}</span></td>
                  <td>{fmt(m.createdAt)}</td>
                  <td>
                    <button className="em-btn" onClick={() => navigate(`/restaurants/restaurant-details/${m.restaurantId}`)}>
                      <FaEye /> View Restaurant
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination metadata={metadata} onPageChange={(p) => setPage(p)} />
    </div>
  );
}
