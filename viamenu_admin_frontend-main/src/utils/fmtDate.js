// The one date format for list tables ("06 Oct 2026"). Non-breaking spaces
// keep it on one line instead of wrapping into a narrow column.
export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, " ")
    : "—";
