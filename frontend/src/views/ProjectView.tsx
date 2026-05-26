import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { I } from "../lib/icons";
import { api, Resource } from "../lib/api";
import { UploadModal } from "../components/UploadModal";

type Props = { projectId: string; onOpenResource: (id: string) => void };

export function ProjectView({ projectId, onOpenResource }: Props) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"resources" | "revision" | "lists">("resources");
  const [showUpload, setShowUpload] = useState(false);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.getProject(projectId),
  });
  const { data: resources = [] } = useQuery({
    queryKey: ["resources", projectId],
    queryFn: () => api.listResources(projectId),
  });

  // Poll while anything is still ingesting
  const anyIngesting = resources.some(
    (r) => r.ingestion_status === "queued" || r.ingestion_status === "processing"
  );
  useEffect(() => {
    if (!anyIngesting) return;
    const t = setInterval(
      () => qc.invalidateQueries({ queryKey: ["resources", projectId] }),
      1500
    );
    return () => clearInterval(t);
  }, [anyIngesting, projectId, qc]);

  return (
    <div className="view-fade" style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ padding: "40px 56px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 30, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <div
                className="mono"
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.08em",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Project
              </div>
              <h1 style={{ fontSize: 38, fontWeight: 600, margin: 0, color: "var(--ink)", letterSpacing: "-0.022em", lineHeight: 1.1 }}>
                {project?.name ?? "…"}
              </h1>
            </div>
            <button onClick={() => setShowUpload(true)} style={btnPrimary}>
              <I.plus width={14} height={14} /> Add PDF
            </button>
          </div>

          <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", marginBottom: 28 }}>
            {[
              { id: "resources", label: "Resources", count: resources.length },
              { id: "revision", label: "Revision", count: 0 },
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
                <ResourceTile key={r.id} resource={r} onClick={() => r.ingestion_status === "ready" && onOpenResource(r.id)} />
              ))}
              <button onClick={() => setShowUpload(true)} style={dashedBtn}>
                <I.plus width={18} height={18} />
                <span style={{ fontSize: 12.5 }}>Add PDF</span>
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

      {showUpload && <UploadModal projectId={projectId} onClose={() => setShowUpload(false)} />}
    </div>
  );
}

function ResourceTile({ resource: r, onClick }: { resource: Resource; onClick: () => void }) {
  const ready = r.ingestion_status === "ready";
  const failed = r.ingestion_status === "failed";
  const pages = r.metadata?.page_count;

  const statusLabel = ready
    ? pages
      ? `${pages} pages`
      : "ready"
    : failed
    ? "failed"
    : r.ingestion_status === "processing"
    ? "extracting…"
    : "queued";

  return (
    <button
      onClick={onClick}
      style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 16,
        aspectRatio: "4 / 3",
        cursor: ready ? "pointer" : "default",
        fontFamily: "inherit",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        opacity: ready ? 1 : 0.75,
      }}
      title={failed ? r.ingestion_error ?? "ingestion failed" : undefined}
    >
      <span
        className="mono"
        style={{
          fontSize: 10,
          color: "var(--muted-2)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {r.type}
      </span>
      <span style={{ flex: 1, fontSize: 14, color: "var(--ink)", fontWeight: 500, lineHeight: 1.3 }}>{r.title}</span>
      <span
        className="mono"
        style={{
          fontSize: 10.5,
          color: failed ? "#B83232" : ready ? "var(--muted)" : "var(--accent)",
        }}
      >
        {statusLabel}
      </span>
    </button>
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

const dashedBtn: React.CSSProperties = {
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
};
