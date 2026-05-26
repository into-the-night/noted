import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { I } from "../lib/icons";
import { api, Project } from "../lib/api";
import { NewProjectModal } from "../components/NewProjectModal";

type Props = { onOpenProject: (id: string) => void };

export function HomeView({ onOpenProject }: Props) {
  const [showNew, setShowNew] = useState(false);
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: api.listProjects,
  });

  return (
    <div className="view-fade" style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "48px 56px 80px" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 40,
            paddingBottom: 24,
            borderBottom: "1px solid var(--border-soft)",
          }}
        >
          <div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.08em",
                color: "var(--muted)",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Welcome
            </div>
            <h1 style={{ fontSize: 44, fontWeight: 600, margin: 0, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1.05 }}>
              Welcome back.
            </h1>
            <div style={{ fontSize: 14.5, color: "var(--muted)", marginTop: 10 }}>
              {isLoading ? "Loading projects…" : `${projects.length} project${projects.length === 1 ? "" : "s"}.`}
            </div>
          </div>
          <button onClick={() => setShowNew(true)} style={btnPrimary}>
            <I.plus width={14} height={14} /> New project
          </button>
        </header>

        <section style={{ marginBottom: 56 }}>
          <SectionHead title="Your projects" hint={`${projects.length} active`} />
          {projects.length === 0 && !isLoading ? (
            <EmptyState onCreate={() => setShowNew(true)} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} onClick={() => onOpenProject(p.id)} />
              ))}
              <button onClick={() => setShowNew(true)} style={dashedBtn}>
                <I.plus width={18} height={18} />
                <span style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>New project</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>One per subject, exam, or unit.</span>
              </button>
            </div>
          )}
        </section>
      </div>

      {showNew && (
        <NewProjectModal
          onClose={() => setShowNew(false)}
          onCreated={(id) => onOpenProject(id)}
        />
      )}
    </div>
  );
}

function ProjectCard({ project: p, onClick }: { project: Project; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "20px 22px",
        textAlign: "left",
        cursor: "pointer",
        fontFamily: "inherit",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: 168,
        transition: "all 160ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--ink)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--accent)",
            color: "var(--accent-fg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {p.name[0]?.toUpperCase()}
        </span>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--muted-2)" }}>
          {timeAgo(p.updated_at)}
        </span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.018em", lineHeight: 1.2, flex: 1 }}>
        {p.name}
      </div>
      <div className="mono" style={{ display: "flex", gap: 18, fontSize: 11, color: "var(--muted)" }}>
        <span>
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>{p.resource_count}</span> resources
        </span>
      </div>
    </button>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px dashed var(--border)",
        borderRadius: 12,
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 15.5, color: "var(--ink)", fontWeight: 500, marginBottom: 6 }}>
        No projects yet.
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>
        Create one per subject or exam — drop in PDFs and start chatting.
      </div>
      <button onClick={onCreate} style={btnPrimary}>
        <I.plus width={14} height={14} /> New project
      </button>
    </div>
  );
}

function SectionHead({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
      <h2 style={{ fontSize: 19, fontWeight: 600, margin: 0, color: "var(--ink)", letterSpacing: "-0.018em" }}>
        {title}
      </h2>
      {hint && (
        <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
          {hint}
        </span>
      )}
    </div>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(mo / 12)}y`;
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
  borderRadius: 12,
  background: "transparent",
  padding: 22,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 6,
  cursor: "pointer",
  color: "var(--muted)",
  minHeight: 168,
  justifyContent: "center",
  textAlign: "left",
  fontFamily: "inherit",
};
