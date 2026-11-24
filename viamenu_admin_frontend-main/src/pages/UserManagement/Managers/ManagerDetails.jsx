import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft, FaBan, FaCheckCircle, FaStore, FaBook, FaEnvelope, FaPhone,
} from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../../utils/axiosInstance";
import StatsCard from "../../../components/common/StatsCard";
import StatusBadge from "../../../components/common/StatusBadge";
import "./ManagerDetails.css";
import { displayName } from "../../../utils/displayName";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
      })
    : "—";

export default function ManagerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [manager, setManager] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/users/managers/${id}`);
      setManager(res.data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not load this manager");
      setManager(null);
    } finally {
      setLoading(false);
    }
  };

  // Only on id change: load is rebuilt every render, so listing it would
  // re-fetch forever. Same pattern as useDataFetch.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  const toggleBlock = async () => {
    const next = !manager.isBlocked;
    setBlocking(true);
    try {
      await axiosInstance.patch(`/admin/users/${manager.id}/block`, {
        isBlocked: next,
        reason: next ? "Blocked by admin" : "",
      });
      toast.success(next ? "Manager blocked" : "Manager unblocked");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Action failed");
    } finally {
      setBlocking(false);
    }
  };

  if (loading) {
    return <div className="md-page"><div className="md-loader"><div className="md-spinner" /></div></div>;
  }

  if (!manager) {
    return (
      <div className="md-page">
        <button className="md-back" onClick={() => navigate("/users/managers")}>
          <FaArrowLeft /> Back to Managers
        </button>
        <div className="md-empty">This manager could not be loaded.</div>
      </div>
    );
  }

  return (
    <div className="md-page">

      <button className="md-back" onClick={() => navigate("/users/managers")}>
        <FaArrowLeft /> Back to Managers
      </button>

      {/* ── Identity ─────────────────────────────────────────────── */}
      <div className="md-header">
        <div
          className="md-avatar"
          style={manager.profileImage ? { backgroundImage: `url(${manager.profileImage})` } : {}}
        >
          {!manager.profileImage && (manager.name?.[0] || "M").toUpperCase()}
        </div>
        <div className="md-head-body">
          <h1 className="md-name">{manager.name || "—"}</h1>
          <div className="md-head-meta">
            <span><FaEnvelope /> {manager.email}</span>
            {manager.phone && <span><FaPhone /> {manager.phone}</span>}
          </div>
          <div className="md-head-badges">
            {manager.isBlocked ? <StatusBadge status="blocked" /> : <StatusBadge status="active" />}
            {manager.isEmailVerified
              ? <StatusBadge status="verified" />
              : <StatusBadge status="unverified" label="Unverified" />}
            <span className={`md-pill ${manager.assignmentStatus === "ASSIGNED" ? "md-pill--ok" : "md-pill--warn"}`}>
              {manager.assignmentStatus === "ASSIGNED" ? "Assigned" : "No restaurant assigned"}
            </span>
          </div>
        </div>
        <button
          className={`md-btn ${manager.isBlocked ? "md-btn--unblock" : "md-btn--block"}`}
          onClick={toggleBlock}
          disabled={blocking}
        >
          {blocking ? <span className="md-mini-spin" /> : manager.isBlocked
            ? <><FaCheckCircle /> Unblock</> : <><FaBan /> Block</>}
        </button>
      </div>

      <div className="md-stats">
        <StatsCard icon={FaStore} label="Restaurants" value={manager.totalRestaurants} color="#2c8769" />
        <StatsCard icon={FaBook} label="Menu grants" value={manager.totalMenus} color="#8a6410" />
      </div>

      {/* ── Who they work for ────────────────────────────────────── */}
      <section className="md-section">
        <h2 className="md-section-title">Works for</h2>
        {manager.owners?.length ? (
          <div className="md-owner-grid">
            {manager.owners.map((o) => (
              <div key={o.id} className="md-owner-card">
                <div className="md-owner-avatar">{(o.name?.[0] || o.email?.[0] || "O").toUpperCase()}</div>
                <div>
                  <div className="md-owner-name">{displayName(o) || "—"}</div>
                  <div className="md-owner-line">{o.email}</div>
                  {o.phone && <div className="md-owner-line">{o.phone}</div>}
                  {o.companyName && <div className="md-owner-line md-owner-co">{o.companyName}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="md-muted">No owner on record.</p>
        )}
      </section>

      {/* ── Account facts ────────────────────────────────────────── */}
      <section className="md-section">
        <h2 className="md-section-title">Account</h2>
        <div className="md-facts">
          <div><span>Username</span><b>{manager.username || "—"}</b></div>
          <div><span>Gender</span><b>{manager.gender || "—"}</b></div>
          <div><span>Country</span><b>{manager.country || "—"}</b></div>
          <div><span>Alt. phone</span><b>{manager.alternatePhone || "—"}</b></div>
          <div><span>Joined</span><b>{fmt(manager.createdAt)}</b></div>
          <div><span>Last login</span><b>{fmtDateTime(manager.lastLoginAt)}</b></div>
          {manager.isBlocked && manager.blockReason && (
            <div className="md-facts-wide"><span>Block reason</span><b>{manager.blockReason}</b></div>
          )}
        </div>
      </section>

      {/* ── What they can touch ──────────────────────────────────── */}
      <section className="md-section">
        <h2 className="md-section-title">Assigned restaurants</h2>
        {manager.assignedRestaurants?.length ? (
          <div className="md-rest-list">
            {manager.assignedRestaurants.map((r) => (
              <div key={r.id} className="md-rest">
                <div className="md-rest-top">
                  <div>
                    <div className="md-rest-name">{r.name}</div>
                    <div className="md-rest-owner">
                      Owner: {displayName(r.owner) || "—"}
                    </div>
                  </div>
                  {/* FULL = every menu in the restaurant. MENUS_ONLY = just the
                      menus listed below — the distinction the owner app draws
                      with a check vs a pencil. */}
                  <span className={`md-access ${r.access === "FULL" ? "md-access--full" : "md-access--partial"}`}>
                    {r.access === "FULL" ? "Full restaurant" : "Specific menus"}
                  </span>
                </div>

                {r.access === "FULL" ? (
                  <div className="md-rest-sub">
                    {r.totalMenus} menu{r.totalMenus === 1 ? "" : "s"} · {r.status}
                    {r.assignedAt && <> · assigned {fmt(r.assignedAt)}</>}
                  </div>
                ) : (
                  <div className="md-menu-chips">
                    {r.menus.map((m) => (
                      <span key={m.id} className="md-menu-chip" title={`Assigned ${fmt(m.assignedAt)}`}>
                        {m.name}
                        <em>{m.published === "PUBLISH" ? "live" : "draft"}</em>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="md-muted">
            Nothing assigned right now. They can still be given restaurants by their owner at any time.
          </p>
        )}
      </section>

      {/* ── How they got here ────────────────────────────────────── */}
      <section className="md-section">
        <h2 className="md-section-title">Invitation history</h2>
        {manager.invites?.length ? (
          <div className="md-scroll">
            <table className="md-table">
              <thead>
                <tr>
                  <th>Invited by</th>
                  <th>Status</th>
                  <th>Sent</th>
                  <th>Accepted (web)</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {manager.invites.map((i) => (
                  <tr key={i.id}>
                    <td>{displayName(i.owner) || "—"}</td>
                    <td><span className="md-inv-status">{i.status}</span></td>
                    <td>{fmt(i.createdAt)}</td>
                    <td>{fmtDateTime(i.inviteeAcceptedAt)}</td>
                    <td>{fmtDateTime(i.acceptedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="md-muted">No invitation on record.</p>
        )}
      </section>
    </div>
  );
}
