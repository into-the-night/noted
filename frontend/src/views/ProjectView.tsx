import { useState } from "react";
import { I } from "../lib/icons";
import { PROJECTS, RESOURCES } from "../lib/mocks";

type Props = { projectId: string; onOpenResource: (id: string) => void; onUpload: () => void };

export function ProjectView({ projectId, onOpenResource, onUpload }: Props) {
  const project = PROJECTS.find((p) => p.id === projectId) ?? PROJECTS[0];
  const [tab, setTab] = useState<"resources" | "revision" | "lists">("resources");
  const resources = RESOURCES.filter((r) => r.projectId === project.id);

  return (
    <div className="view-fade" style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ padding: "40px 56px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 30, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <div className="mono" style={{ fontSize: 10.5, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 10 }}>
                Project · last opened {project.lastSeen}
              </div>
              <h1 style={{ fontSize: 38, fontWeight: 600, margin: 0, color: "var(--ink)", letterSpacing: "-0.022em", lineHeight: 1.1 }}>{project.name}</h1>
            </div>
            <button onClick={onUpload} style={btnPrimary}>
              <I.plus width={14} height={14} /> Add resource
            </button>
          </div>

          <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", marginBottom: 28 }}>
            {[
              { id: "resources", label: "Resources", count: project.resources },
              { id: "revision", label: "Revision", count: project.stars },
              { id: "lists", label: "Lists", count: 0 },
            ].map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as typeof tab)}
                  style={{
                    padding: "10px 14px 12px",
                    background: "transparent",
                    border: "none",
                    borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}`,
                    marginBottom: -1,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    color: active ? "var(--ink)" : "var(--muted)",
                    fontSize: 13.5,
                    fontWeight: active ? 500 : 400,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {t.label}
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--muted-2)" }}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {tab === "resources" && (
          <div style={{ padding: "0 56px 80px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
              {resources.map((r) => (
                <button
                  key={r.id}
                  onClick={() => r.status === "ready" && onOpenResource(r.id)}
                  style={{
                    background: "var(--panel)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: 16,
                    aspectRatio: "4 / 3",
                    cursor: r.status === "ready" ? "pointer" : "default",
                    fontFamily: "inherit",
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    opacity: r.status === "ready" ? 1 : 0.6,
                  }}
                >
                  <span className="mono" style={{ fontSize: 10, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {r.type}
                  </span>
                  <span style={{ flex: 1, fontSize: 14, color: "var(--ink)", fontWeight: 500, lineHeight: 1.3 }}>{r.title}</span>
                  <span className="mono" style={{ fontSize: 10.5, color: r.status === "ready" ? "var(--muted)" : "var(--accent)" }}>
                    {r.status === "ready" ? r.hint : `· ${r.hint}`}
                  </span>
                </button>
              ))}
              <button
                onClick={onUpload}
                style={{
                  border: "1.5px dashed var(--border)",
                  borderRadius: 8,
                  background: "transparent",
                  aspectRatio: "4 / 3",
                  cursor: "pointer",
                  color: "var(--muted)",
                  fontFamily: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <I.plus width={18} height={18} />
                <span style={{ fontSize: 12.5 }}>Add resource</span>
              </button>
            </div>
          </div>
        )}

        {tab === "revision" && (
          <div style={{ padding: "0 56px 80px", color: "var(--muted)", fontSize: 14 }}>
            Stars will appear here once you start capturing them. (Stage 4)
          </div>
        )}
        {tab === "lists" && (
          <div style={{ padding: "0 56px 80px", color: "var(--muted)", fontSize: 14 }}>
            Lists let you group cards manually. None yet.
          </div>
        )}
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 13px",
  background: "var(--accent)",
  color: "var(--accent-fg)",
  border: "1px solid var(--accent)",
  borderRadius: 7,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
  fontFamily: "inherit",
};
