import React, { useState } from "react";
import { rowClick } from "../../utils/rowClick";
import { FaClock, FaEye, FaToggleOn } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { useDataFetch } from "../../hooks/useDataFetch";
import StatsCard from "../../components/common/StatsCard";
import Pagination from "../../components/common/Pagination";
import axiosInstance from "../../utils/axiosInstance";
import "./StaleDrafts.css";
import { displayName } from "../../utils/displayName";

export default function StaleDrafts() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState({});

  const { data: restaurants, loading, metadata, refetch } = useDataFetch(
    "/admin/moderation/stale-drafts", "restaurants", { page, limit: 10 }
  );

  const handlePublish = async (r) => {
    setActionLoading((p) => ({ ...p, [r.id]: true }));
    try {
      await axiosInstance.patch(`/admin/restaurant/${r.id}/status`, { status: "PUBLISH" });
      toast.success(`${r.name} published`);
      refetch();
    } catch (e) {
      toast.error(e.response?.data?.message || "Cannot publish — ensure restaurant has a published menu with dishes");
    } finally {
      setActionLoading((p) => ({ ...p, [r.id]: false }));
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";

  return (
    <div className="sd-page">
      <div className="sd-header">
        <h1 className="sd-title">Stale Drafts</h1>
        <p className="sd-subtitle">Restaurants in Draft status for more than 7 days</p>
      </div>
      <div className="sd-stats">
        <StatsCard icon={FaClock} label="Stale Drafts" value={metadata.total_records} color="#f59e0b" />
      </div>
      <div className="sd-table-wrap">
        {loading ? (
          <div className="sd-loader"><div className="sd-spinner" /></div>
        ) : restaurants.length === 0 ? (
          <div className="sd-empty">No stale draft restaurants</div>
        ) : (
          <table className="sd-table">
            <thead>
              <tr>
                <th>Restaurant</th>
                <th>Owner</th>
                <th>Location</th>
                <th>Draft Since</th>
                <th>Days Old</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r.id} className="dt-row--clickable" onClick={rowClick(() => navigate(`/restaurants/restaurant-details/${r.id}`))}>
                  <td>
                    <div className="sd-rest">
                      <div className="sd-avatar">{(r.name?.[0] || "R").toUpperCase()}</div>
                      <div>
                        <div className="sd-name">{r.name}</div>
                        <div className="sd-email">{r.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{displayName(r.owner) || "—"}</td>
                  <td>{r.addressCity || "—"}</td>
                  <td>{fmt(r.createdAt)}</td>
                  <td>
                    <span className={`sd-days ${r.daysOld > 30 ? "sd-days--old" : ""}`}>
                      {r.daysOld} days
                    </span>
                  </td>
                  <td>
                    <div className="sd-actions">
                      <button className="sd-btn sd-btn--view" onClick={() => navigate(`/restaurants/restaurant-details/${r.id}`)}>
                        <FaEye /> View
                      </button>
                      <button className="sd-btn sd-btn--publish" onClick={() => handlePublish(r)} disabled={actionLoading[r.id]}>
                        {actionLoading[r.id] ? <span className="sd-mini-spin" /> : <><FaToggleOn /> Publish</>}
                      </button>
                    </div>
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
