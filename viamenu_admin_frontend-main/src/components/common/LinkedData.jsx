import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import "./shared.css";

const LABELS = {
  restaurants: "restaurant(s) owned",
  activeSubscriptions: "active subscription",
  managerAccess: "restaurant/menu access(es) as manager — removed with the user",
  orders: "order(s) placed — kept in order history",
  activeSubscribers: "owner(s) currently subscribed",
  pastSubscriptions: "past subscription(s) — kept in billing history",
};
const HINTS = {
  restaurants: "Delete or hand over the restaurants first, or block the user instead.",
  activeSubscribers: "Deactivate the plan instead.",
};

/**
 * Lists what still points at the object (GET `url` → { links }) in a delete
 * dialog. Reports `true` to onBlockedChange while checking and when a link
 * blocks the delete; the backend enforces the same rule regardless.
 */
export default function LinkedData({ url, onBlockedChange }) {
  const [links, setLinks] = useState(null);

  useEffect(() => {
    let live = true;
    onBlockedChange?.(true);
    axiosInstance
      .get(url)
      .then((r) => r.data?.data?.links ?? [])
      .catch(() => "error")
      .then((l) => {
        if (!live) return;
        setLinks(l);
        onBlockedChange?.(l !== "error" && l.some((x) => x.blocking));
      });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  if (!links) return <p className="confirmation-subtext">Checking linked data…</p>;
  if (links === "error") return <p className="confirmation-subtext">Couldn't check linked data.</p>;
  if (!links.length) return <p className="confirmation-subtext">Nothing else is linked to this.</p>;

  const blocked = links.some((l) => l.blocking);
  return (
    <div className={`linked-data${blocked ? " linked-data--blocked" : ""}`}>
      <strong>{blocked ? "Can't be deleted — still in use:" : "Linked data:"}</strong>
      <ul>
        {links.map((l) => (
          <li key={l.key}>
            {l.count} {LABELS[l.key] ?? l.key}
            {l.blocking && HINTS[l.key] && <div className="linked-data__hint">{HINTS[l.key]}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
