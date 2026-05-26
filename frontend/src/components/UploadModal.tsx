import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { I } from "../lib/icons";
import { api } from "../lib/api";

type Props = { projectId: string; onClose: () => void };

export function UploadModal({ projectId, onClose }: Props) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: () => api.uploadResource(projectId, file!, title || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resources", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      onClose();
    },
  });

  const pick = (f: File | null) => {
    if (!f) return;
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.pdf$/i, ""));
  };

  return (
    <div
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
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560,
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
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>Add a PDF</h2>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)" }}
            aria-label="Close"
          >
            <I.close />
          </button>
        </div>

        <div style={{ padding: "20px 26px 22px" }}>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              pick(e.dataTransfer.files?.[0] ?? null);
            }}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `1.5px dashed ${drag ? "var(--accent)" : "var(--border)"}`,
              background: drag ? "var(--accent-tint)" : "var(--panel-2)",
              borderRadius: 12,
              padding: "44px 24px",
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            <div style={{ color: "var(--accent)", marginBottom: 10 }}>
              <I.upload width={22} height={22} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}>
              {file ? file.name : "Drop a PDF here"}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
              {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "or click to browse · up to 200 MB"}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              hidden
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label
              className="mono"
              style={{
                display: "block",
                fontSize: 10,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: 6,
              }}
            >
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resource title"
              style={{
                width: "100%",
                padding: "9px 12px",
                background: "var(--panel-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontFamily: "inherit",
                fontSize: 13.5,
                color: "var(--ink)",
                outline: "none",
              }}
            />
          </div>

          {upload.isError && (
            <div style={{ marginTop: 12, fontSize: 12.5, color: "#B83232" }}>
              {(upload.error as Error).message}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
            <button
              onClick={onClose}
              style={{
                padding: "7px 12px",
                background: "transparent",
                color: "var(--ink-soft)",
                border: "1px solid var(--border)",
                borderRadius: 7,
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
            <button
              disabled={!file || upload.isPending}
              onClick={() => upload.mutate()}
              style={{
                padding: "7px 14px",
                background: "var(--accent)",
                color: "var(--accent-fg)",
                border: "1px solid var(--accent)",
                borderRadius: 7,
                cursor: file && !upload.isPending ? "pointer" : "not-allowed",
                opacity: file && !upload.isPending ? 1 : 0.5,
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "inherit",
              }}
            >
              {upload.isPending ? "Uploading…" : "Add to project"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
