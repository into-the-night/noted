import { I } from "../lib/icons";
import { PROJECTS, RECENT_STARS } from "../lib/mocks";

type Props = { onOpenProject: (id: string) => void; onUpload: () => void };

export function HomeView({ onOpenProject, onUpload }: Props) {
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
            <div className="mono" style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>
              Welcome
            </div>
            <h1 style={{ fontSize: 44, fontWeight: 600, margin: 0, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1.05 }}>
              Welcome back.
            </h1>
            <div style={{ fontSize: 14.5, color: "var(--muted)", marginTop: 10 }}>
              {PROJECTS.length} projects · pinned chats and stars across all subjects.
            </div>
          </div>
          <button onClick={onUpload} style={btnPrimary}>
            <I.plus width={14} height={14} /> New project
          </button>
        </header>

        <section style={{ marginBottom: 56 }}>
          <SectionHead title="Your projects" hint={`${PROJECTS.length} active`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {PROJECTS.map((p) => (
              <button
                key={p.id}
                onClick={() => onOpenProject(p.id)}
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
                  e.currentTarget.style.borderColor = "var(--accent)";
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
                    {p.name[0]}
                  </span>
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--muted-2)" }}>
                    {p.lastSeen}
                  </span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.018em", lineHeight: 1.2, flex: 1 }}>{p.name}</div>
                <div className="mono" style={{ display: "flex", gap: 18, fontSize: 11, color: "var(--muted)" }}>
                  <span>
                    <span style={{ color: "var(--ink)", fontWeight: 500 }}>{p.resources}</span> resources
                  </span>
                  <span style={{ color: "var(--gold)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <I.starFilled width={10} height={10} /> {p.stars}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <SectionHead title="Recent stars" hint="Across all projects" />
          <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, padding: "4px 22px 8px" }}>
            {RECENT_STARS.map((s) => (
              <div key={s.id} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid var(--border-soft)" }}>
                <span style={{ color: "var(--gold)", flexShrink: 0, paddingTop: 2 }}>
                  <I.starFilled width={12} height={12} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", marginBottom: 4 }}>
                    {s.source} · {s.ago}
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>{s.summary}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHead({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
      <h2 style={{ fontSize: 19, fontWeight: 600, margin: 0, color: "var(--ink)", letterSpacing: "-0.018em" }}>{title}</h2>
      {hint && <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{hint}</span>}
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
