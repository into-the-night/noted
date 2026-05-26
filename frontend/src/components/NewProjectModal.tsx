import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { I } from "../lib/icons";

type Props = { onClose: () => void; onCreated?: (id: string) => void };

export function NewProjectModal({ onClose, onCreated }: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState("");

  const create = useMutation({
    mutationFn: () => api.createProject(name.trim()),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      onCreated?.(p.id);
      onClose();
    },
  });

  const submit = () => {
    if (!name.trim() || create.isPending) return;
    create.mutate();
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
          width: 460,
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
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>New project</h2>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)" }}
            aria-label="Close"
          >
            <I.close />
          </button>
        </div>
        <div style={{ padding: "20px 26px 22px" }}>
          <label
            className="mono"
            style={{
              display: "block",
              fontSize: 10,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: 8,
            }}
          >
            Name
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Operating Systems"
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "var(--panel-2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontFamily: "inherit",
              fontSize: 14,
              color: "var(--ink)",
              outline: "none",
            }}
          />
          {create.isError && (
            <div style={{ marginTop: 10, fontSize: 12.5, color: "#B83232" }}>
              {(create.error as Error).message}
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
              disabled={!name.trim() || create.isPending}
              onClick={submit}
              style={{
                padding: "7px 14px",
                background: "var(--accent)",
                color: "var(--accent-fg)",
                border: "1px solid var(--accent)",
                borderRadius: 7,
                cursor: name.trim() && !create.isPending ? "pointer" : "not-allowed",
                opacity: name.trim() && !create.isPending ? 1 : 0.5,
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "inherit",
              }}
            >
              {create.isPending ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
