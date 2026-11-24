// The user cell shared by every User Management list: avatar, name, email and
// the full ID (never cut off).
export const userColumn = (label = "User") => ({
  key: "name",
  label,
  sort: "name",
  render: (_v, u) => (
    <div className="nc">
      <div
        className="av av--md"
        style={u.profileImage ? { backgroundImage: `url(${u.profileImage})` } : { background: "#2c8769" }}
      >
        {!u.profileImage && (u.name || u.username || u.email || "?").charAt(0).toUpperCase()}
      </div>
      <div className="nc-body">
        <span className="nc-name">{u.name || u.username || "—"}</span>
        <span className="nc-sub">{u.email}</span>
        <span className="nc-id">ID: {u.id}</span>
      </div>
    </div>
  ),
});
