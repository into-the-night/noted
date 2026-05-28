import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PdfViewer } from "../components/PdfViewer";
import { ChatPanel } from "../components/ChatPanel";
import { SettingsModal } from "../components/SettingsModal";

export function ResourceView({ resourceId }: { resourceId: string }) {
  const { data: resource, isLoading } = useQuery({
    queryKey: ["resource", resourceId],
    queryFn: () => api.getResource(resourceId),
  });
  const [page, setPage] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  const ready = resource?.ingestion_status === "ready";

  return (
    <div className="view-fade" style={{ flex: 1, display: "flex", minHeight: 0 }}>
      <div style={{ flex: "1 1 60%", minWidth: 0, display: "flex", flexDirection: "column" }}>
        {isLoading || !resource ? (
          <div style={center}>Loading…</div>
        ) : !ready ? (
          <div style={center}>Resource is {resource.ingestion_status}…</div>
        ) : resource.type === "pdf" ? (
          <PdfViewer
            fileUrl={api.resourceFileUrl(resource.id)}
            title={resource.title}
            page={page}
            onPageChange={setPage}
          />
        ) : (
          <div style={center}>Viewer for {resource.type} arrives in a later stage.</div>
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
        {ready && resource ? (
          <ChatPanel
            resourceId={resource.id}
            resourceType={resource.type}
            currentPage={page}
            onJumpToPage={setPage}
            onOpenSettings={() => setShowSettings(true)}
          />
        ) : (
          <div style={{ padding: 18, color: "var(--muted)", fontSize: 13.5 }}>
            Chat unlocks once the resource is ready.
          </div>
        )}
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

const center: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--muted)",
};
