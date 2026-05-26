import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PdfViewer } from "../components/PdfViewer";

export function ResourceView({ resourceId }: { resourceId: string }) {
  const { data: resource, isLoading } = useQuery({
    queryKey: ["resource", resourceId],
    queryFn: () => api.getResource(resourceId),
  });

  return (
    <div className="view-fade" style={{ flex: 1, display: "flex", minHeight: 0 }}>
      <div style={{ flex: "1 1 60%", minWidth: 0, display: "flex", flexDirection: "column" }}>
        {isLoading || !resource ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
            Loading…
          </div>
        ) : resource.ingestion_status !== "ready" ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
            Resource is {resource.ingestion_status}…
          </div>
        ) : resource.type === "pdf" ? (
          <PdfViewer fileUrl={api.resourceFileUrl(resource.id)} title={resource.title} />
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
            Viewer for {resource.type} arrives in a later stage.
          </div>
        )}
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
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-soft)", fontSize: 13, fontWeight: 500 }}>
          Chat
        </div>
        <div style={{ flex: 1, padding: 18, color: "var(--muted)", fontSize: 13.5, lineHeight: 1.5 }}>
          Chat (Gemini) wires up in Stage 2. The pin model lands in Stage 3.
        </div>
      </div>
    </div>
  );
}
