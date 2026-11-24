import "./StatusBadge.css";

const VARIANTS = {
  PUBLISH:   { label: "Published", cls: "badge--published" },
  DRAFT:     { label: "Draft",     cls: "badge--draft" },
  active:    { label: "Active",    cls: "badge--published" },
  inactive:  { label: "Inactive",  cls: "badge--draft" },
  blocked:   { label: "Blocked",   cls: "badge--blocked" },
  deleted:   { label: "Deleted",   cls: "badge--blocked" },
  complete:  { label: "Complete",  cls: "badge--published" },
  incomplete:{ label: "Incomplete",cls: "badge--draft" },
  verified:  { label: "Verified",  cls: "badge--verified" },
  unverified:{ label: "Unverified",cls: "badge--draft" },
  owner:     { label: "Owner",     cls: "badge--owner" },
  manager:   { label: "Manager",   cls: "badge--manager" },
  guest:     { label: "Guest",     cls: "badge--guest" },
  // Subscriptions / payments / orders / support / pages (uppercase = backend enums)
  ACTIVE:      { label: "Active",      cls: "badge--published" },
  PAUSED:      { label: "Paused",      cls: "badge--draft" },
  CANCELED:    { label: "Canceled",    cls: "badge--guest" },
  EXPIRED:     { label: "Expired",     cls: "badge--blocked" },
  PENDING:     { label: "Pending",     cls: "badge--draft" },
  PAID:        { label: "Paid",        cls: "badge--published" },
  FAILED:      { label: "Failed",      cls: "badge--blocked" },
  REFUNDED:    { label: "Refunded",    cls: "badge--manager" },
  ORDERED:     { label: "Ordered",     cls: "badge--verified" },
  PREPARING:   { label: "Preparing",   cls: "badge--draft" },
  READY:       { label: "Meal ready",  cls: "badge--owner" },
  DELIVERED:   { label: "Delivered",   cls: "badge--published" },
  CANCELLED:   { label: "Cancelled",   cls: "badge--blocked" },
  OPEN:        { label: "Open",        cls: "badge--verified" },
  IN_PROGRESS: { label: "In progress", cls: "badge--draft" },
  RESOLVED:    { label: "Resolved",    cls: "badge--published" },
  CLOSED:      { label: "Closed",      cls: "badge--guest" },
  APPROVED:    { label: "Approved",    cls: "badge--published" },
  REJECTED:    { label: "Rejected",    cls: "badge--blocked" },
};

export default function StatusBadge({ status, label: overrideLabel }) {
  const v = VARIANTS[status] || { label: status || "Unknown", cls: "badge--default" };
  return (
    <span className={`status-badge ${v.cls}`}>
      {overrideLabel || v.label}
    </span>
  );
}
