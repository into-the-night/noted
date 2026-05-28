import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { I } from "../lib/icons";

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"];

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: api.getSettings });
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [pdfPages, setPdfPages] = useState(3);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    setModel(settings.chat_model);
    setPdfPages(settings.pdf_context_pages);
  }, [settings]);

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      const patch: any = {
        chat_provider: "google",
        chat_model: model,
        pdf_context_pages: pdfPages,
      };
      if (apiKey.trim()) patch.google_api_key = apiKey.trim();
      await api.updateSettings(patch);
      await qc.invalidateQueries({ queryKey: ["settings"] });
      setApiKey("");
      onClose();
    } catch (e: any) {
      setErr(e?.message || "save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(10,10,10,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 540,
          background: "var(--panel)",
          borderRadius: 14,
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 26px 18px",
            borderBottom: "1px solid var(--border-soft)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              className="mono"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.08em",
                color: "var(--muted)",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Stage 2 · Gemini
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>Chat settings</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              padding: 4,
            }}
          >
            {I.close({})}
          </button>
        </div>

        <div style={{ padding: "22px 26px 26px", display: "flex", flexDirection: "column", gap: 18 }}>
          <Field
            label="Google API key"
            hint={settings?.has_google_key ? "A key is configured. Leave blank to keep it." : "Required for chat."}
          >
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={settings?.has_google_key ? "•••••••••• (unchanged)" : "AIza…"}
              style={inputStyle}
            />
          </Field>

          <Field label="Chat model">
            <select value={model} onChange={(e) => setModel(e.target.value)} style={inputStyle}>
              {GEMINI_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>

          <Field label="PDF context window (pages on each side)">
            <input
              type="number"
              min={0}
              max={20}
              value={pdfPages}
              onChange={(e) => setPdfPages(parseInt(e.target.value || "0", 10) || 0)}
              style={inputStyle}
            />
          </Field>

          {err && (
            <div style={{ color: "#C2410C", fontSize: 12.5 }}>{err}</div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
            <button
              onClick={onClose}
              style={{
                padding: "7px 13px",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 7,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                color: "var(--ink-soft)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              style={{
                padding: "7px 13px",
                background: "var(--accent)",
                color: "var(--accent-fg)",
                border: "none",
                borderRadius: 7,
                cursor: saving ? "wait" : "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--muted)",
        }}
      >
        {label}
      </span>
      {children}
      {hint && (
        <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{hint}</span>
      )}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 7,
  padding: "8px 11px",
  background: "var(--panel-2)",
  color: "var(--ink)",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
};
