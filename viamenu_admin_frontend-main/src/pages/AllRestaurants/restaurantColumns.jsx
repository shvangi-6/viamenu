// Columns shared by the restaurant sub-lists (Pending / Published / Draft /
// No Menu), so the same data looks the same on every one of them.

import { fmtDate } from "../../utils/fmtDate";
import { displayName } from "../../utils/displayName";

export const restaurantColumn = {
  key: "name",
  label: "Restaurant",
  sort: "name",
  render: (_v, r) => (
    <div className="nc">
      <div className="av av--md av--square" style={{ background: "#2c8769" }}>
        {(r.name?.[0] || "R").toUpperCase()}
      </div>
      <div className="nc-body">
        <span className="nc-name">{r.name || "—"}</span>
        {r.email && <span className="nc-sub">{r.email}</span>}
      </div>
    </div>
  ),
};

export const ownerColumn = {
  key: "owner",
  label: "Owner",
  render: (_v, r) => (
    <div className="nc-body">
      <span>{displayName(r.owner) || "—"}</span>
      {r.owner?.email && <span className="nc-sub">{r.owner.email}</span>}
    </div>
  ),
};

// /admin/restaurant/all returns city/country; /admin/moderation/* returns addressCity/addressCountry.
export const locationColumn = {
  key: "city",
  label: "Location",
  sort: "city",
  render: (_v, r) =>
    [r.city ?? r.addressCity, r.country ?? r.addressCountry].filter(Boolean).join(", ") || "—",
};

export const countColumn = (key, label, sort, color = "green") => ({
  key,
  label,
  sort,
  render: (v) => <span className={`count-badge count-badge--${color}`}>{v ?? 0}</span>,
});

export const dateColumn = (label) => ({
  key: "createdAt",
  label,
  sort: "createdAt",
  render: (v) => fmtDate(v),
});
