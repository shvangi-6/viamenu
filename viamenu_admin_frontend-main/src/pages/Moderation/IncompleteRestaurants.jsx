import React, { useState } from "react";
import { rowClick } from "../../utils/rowClick";
import { FaExclamationTriangle, FaEye } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { useDataFetch } from "../../hooks/useDataFetch";
import StatsCard from "../../components/common/StatsCard";
import Pagination from "../../components/common/Pagination";
import "./IncompleteRestaurants.css";
import { displayName } from "../../utils/displayName";

export default function IncompleteRestaurants() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: restaurants, loading, metadata } = useDataFetch(
    "/admin/moderation/incomplete", "restaurants", { page, limit: 10 }
  );

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";

  return (
    <div className="ir-page">
      <div className="ir-header">
        <h1 className="ir-title">Incomplete Restaurants</h1>
        <p className="ir-subtitle">Restaurants with missing setup information</p>
      </div>
      <div className="ir-stats">
        <StatsCard icon={FaExclamationTriangle} label="Incomplete" value={metadata.total_records} color="#ef4444" />
      </div>
      <div className="ir-table-wrap">
        {loading ? (
          <div className="ir-loader"><div className="ir-spinner" /></div>
        ) : restaurants.length === 0 ? (
          <div className="ir-empty">All restaurants are properly set up</div>
        ) : (
          <table className="ir-table">
            <thead>
              <tr>
                <th>Restaurant</th>
                <th>Owner</th>
                <th>Issues</th>
                <th>Location</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r.id} className="dt-row--clickable" onClick={rowClick(() => navigate(`/restaurants/restaurant-details/${r.id}`))}>
                  <td>
                    <div className="ir-rest">
                      <div className="ir-avatar">{(r.name?.[0] || "R").toUpperCase()}</div>
                      <div>
                        <div className="ir-name">{r.name}</div>
                        <div className="ir-email">{r.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{displayName(r.owner) || "—"}</div>
                    <div className="ir-sub">{r.owner?.email || ""}</div>
                  </td>
                  <td>
                    <div className="ir-issues">
                      {(r.issues || []).map((issue, i) => (
                        <span key={i} className="ir-issue">{issue}</span>
                      ))}
                    </div>
                  </td>
                  <td>{r.addressCity || "—"}</td>
                  <td>{fmt(r.createdAt)}</td>
                  <td>
                    <button className="ir-btn" onClick={() => navigate(`/restaurants/restaurant-details/${r.id}`)}>
                      <FaEye /> View
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
