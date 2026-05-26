import { RESOURCES } from "../lib/mocks";

export function ResourceView({ resourceId }: { resourceId: string }) {
  const resource = RESOURCES.find((r) => r.id === resourceId) ?? RESOURCES[0];

  return (
    <div className="view-fade" style={{ flex: 1, display: "flex", minHeight: 0 }}>
      <div style={{ flex: "1 1 60%", minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            padding: "10px 14px",
            background: "var(--panel)",
            borderBottom: "1px solid var(--border-soft)",
            minHeight: 44,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{resource.title}</span>
          <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
            {resource.type} · {resource.hint}
          </span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 14 }}>
          Viewer for <span style={{ color: "var(--accent)", margin: "0 6px", fontWeight: 500 }}>{resource.type}</span> arrives in Stage 1.
        </div>
      </div>
      <div
        style={{
          flex: "1 1 40%",
          minWidth: 380,
          maxWidth: 540,
          borderLeft: "1px solid var(--border)",
          background: "var(--panel)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-soft)", fontSize: 13, fontWeight: 500 }}>Chat</div>
        <div style={{ flex: 1, padding: 18, color: "var(--muted)", fontSize: 13.5, lineHeight: 1.5 }}>
          Chat (Gemini) wires up in Stage 2. The pin model lands in Stage 3.
        </div>
      </div>
    </div>
  );
}
