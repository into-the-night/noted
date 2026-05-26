import { I } from "../lib/icons";

type Route = { view: "home" | "project" | "resource"; projectId?: string; resourceId?: string };

export function TopBar({ route, onNavigate }: { route: Route; onNavigate: (r: Partial<Route>) => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "10px 22px",
        borderBottom: "1px solid var(--border-soft)",
        background: "var(--panel)",
        minHeight: 50,
      }}
    >
      <button
        onClick={() => onNavigate({ view: "home" })}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          color: "var(--ink)",
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: "-0.018em",
          padding: 0,
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: "var(--accent)",
            color: "var(--accent-fg)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          N
        </span>
        Noted
      </button>

      <div className="mono" style={{ fontSize: 11, color: "var(--muted-2)" }}>
        {route.view === "home" ? "home" : route.view === "project" ? `project · ${route.projectId}` : `resource · ${route.resourceId}`}
      </div>

      <div style={{ flex: 1 }} />

      <button
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px",
          background: "transparent",
          color: "var(--muted)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 12,
          fontFamily: "inherit",
        }}
      >
        <I.search width={12} height={12} />
        Search
        <kbd>⌘K</kbd>
      </button>
      <button
        style={{
          padding: 6,
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: 6,
          cursor: "pointer",
          color: "var(--muted)",
          display: "inline-flex",
        }}
      >
        <I.settings width={14} height={14} />
      </button>
    </div>
  );
}
