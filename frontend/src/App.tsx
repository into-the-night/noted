import { useEffect, useState } from "react";
import { TopBar } from "./components/TopBar";
import { HomeView } from "./views/HomeView";
import { ProjectView } from "./views/ProjectView";
import { ResourceView } from "./views/ResourceView";

type Route =
  | { view: "home" }
  | { view: "project"; projectId: string }
  | { view: "resource"; resourceId: string };

export default function App() {
  const [route, setRoute] = useState<Route>({ view: "home" });
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setApiOk(d.status === "ok"))
      .catch(() => setApiOk(false));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw" }}>
      <TopBar
        route={route as any}
        onNavigate={(r) => {
          if (r.view) setRoute(r as Route);
        }}
      />
      <main style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {route.view === "home" && (
          <HomeView onOpenProject={(id) => setRoute({ view: "project", projectId: id })} />
        )}
        {route.view === "project" && (
          <ProjectView
            projectId={route.projectId}
            onOpenResource={(id) => setRoute({ view: "resource", resourceId: id })}
          />
        )}
        {route.view === "resource" && <ResourceView resourceId={route.resourceId} />}
      </main>
      <div
        className="mono"
        style={{
          position: "fixed",
          bottom: 10,
          right: 14,
          fontSize: 10.5,
          color: apiOk === null ? "var(--muted-2)" : apiOk ? "var(--accent)" : "#B83232",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          padding: "3px 8px",
          borderRadius: 6,
        }}
      >
        api: {apiOk === null ? "…" : apiOk ? "ok" : "down"}
      </div>
    </div>
  );
}
