import { useNavigate, useLocation } from "react-router-dom";

// React Router renders nothing at all for an unmatched path — no error, no
// warning, just a white screen. Any typo'd or half-built URL looked identical
// to a crashed page. This makes "no such route" say so, and shows the path so
// it is obvious whether the URL is wrong or the route is genuinely missing.
export default function NotFound() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div style={{ padding: 40, fontFamily: "system-ui, sans-serif", maxWidth: 640 }}>
      <h2 style={{ margin: "0 0 8px", color: "#12211c" }}>Page not found</h2>
      <p style={{ margin: "0 0 6px", color: "#5b6b64", lineHeight: 1.55 }}>
        No screen is mapped to this address.
      </p>
      <code
        style={{
          display: "inline-block",
          background: "#f3f6f4",
          border: "1px solid #e0e6e2",
          borderRadius: 6,
          padding: "6px 10px",
          fontSize: 13,
          color: "#40514a",
          wordBreak: "break-all",
        }}
      >
        {pathname}
      </code>

      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "none",
            background: "#2c8769",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "1.5px solid #cfe0d8",
            background: "#fff",
            color: "#2c8769",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Go back
        </button>
      </div>
    </div>
  );
}
