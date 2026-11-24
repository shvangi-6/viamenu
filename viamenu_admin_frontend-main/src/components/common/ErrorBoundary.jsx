import { Component } from "react";

// Without this, one throwing component unmounts the WHOLE React tree — sidebar
// and all — and the browser shows a completely white page with nothing in it.
// That is not a hypothetical: a drill-down page did exactly that, and the only
// way to find out why was to read the source, because the screen itself said
// nothing. This turns that into a message plus the actual error.
//
// Must be a class: there is still no hook equivalent of componentDidCatch.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep the component stack in the console — the on-screen message is for
    // whoever hit it, this is for whoever has to fix it.
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={{ padding: 40, fontFamily: "system-ui, sans-serif", maxWidth: 720 }}>
        <h2 style={{ margin: "0 0 8px", color: "#a8431d" }}>This page failed to load</h2>
        <p style={{ margin: "0 0 20px", color: "#5b6b64", lineHeight: 1.55 }}>
          Something in this screen threw an error. The details below are what
          the developer needs.
        </p>

        <pre
          style={{
            background: "#f8f6f4",
            border: "1px solid #e5e0dc",
            borderRadius: 8,
            padding: 16,
            overflowX: "auto",
            fontSize: 13,
            color: "#a8431d",
            whiteSpace: "pre-wrap",
          }}
        >
          {String(error?.stack || error?.message || error)}
        </pre>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            onClick={() => this.setState({ error: null })}
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
            Try again
          </button>
          <button
            onClick={() => window.history.back()}
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
}
