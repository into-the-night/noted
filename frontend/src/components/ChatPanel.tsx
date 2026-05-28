import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, Chat, ChatMessage, Citation } from "../lib/api";
import { I } from "../lib/icons";

type Props = {
  resourceId: string;
  resourceType: "pdf" | "pptx" | "youtube" | "video";
  currentPage: number;
  onJumpToPage: (page: number) => void;
  onOpenSettings: () => void;
};

export function ChatPanel({ resourceId, resourceType, currentPage, onJumpToPage, onOpenSettings }: Props) {
  const qc = useQueryClient();
  const { data: chats = [] } = useQuery({
    queryKey: ["chats", resourceId],
    queryFn: () => api.listChats(resourceId),
  });
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (activeId && chats.some((c) => c.id === activeId)) return;
    setActiveId(chats[0]?.id ?? null);
  }, [chats, activeId]);

  const newChat = async () => {
    const c = await api.createChat(resourceId);
    await qc.invalidateQueries({ queryKey: ["chats", resourceId] });
    setActiveId(c.id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <TabStrip
        chats={chats}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={newChat}
        onOpenSettings={onOpenSettings}
      />
      {activeId ? (
        <ChatThread
          key={activeId}
          chatId={activeId}
          resourceType={resourceType}
          currentPage={currentPage}
          onJumpToPage={onJumpToPage}
          onChatRenamed={() => qc.invalidateQueries({ queryKey: ["chats", resourceId] })}
        />
      ) : (
        <EmptyState onNew={newChat} />
      )}
    </div>
  );
}

function TabStrip({
  chats,
  activeId,
  onSelect,
  onNew,
  onOpenSettings,
}: {
  chats: Chat[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        borderBottom: "1px solid var(--border-soft)",
        background: "var(--panel-2)",
        minHeight: 40,
        overflowX: "auto",
      }}
    >
      {chats.map((c) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            style={{
              padding: "9px 14px",
              background: active ? "var(--panel)" : "transparent",
              border: "none",
              borderRight: "1px solid var(--border-soft)",
              borderBottom: active ? "1px solid var(--panel)" : "none",
              marginBottom: active ? -1 : 0,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 12.5,
              color: active ? "var(--ink)" : "var(--ink-soft)",
              fontWeight: active ? 500 : 400,
              maxWidth: 220,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {c.is_pinned && <span style={{ color: "var(--accent)" }}>{I.pin({ width: 11, height: 11 })}</span>}
            {c.name}
          </button>
        );
      })}
      <button
        onClick={onNew}
        title="New chat"
        style={{
          padding: "0 12px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--muted)",
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 12,
          fontFamily: "inherit",
        }}
      >
        {I.plus({ width: 12, height: 12 })} New
      </button>
      <div style={{ flex: 1 }} />
      <button
        onClick={onOpenSettings}
        title="Chat settings"
        style={{
          padding: "0 12px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--muted)",
          display: "inline-flex",
          alignItems: "center",
          fontFamily: "inherit",
        }}
      >
        {I.settings({ width: 13, height: 13 })}
      </button>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        color: "var(--muted)",
        padding: 24,
      }}
    >
      <div style={{ fontSize: 13.5 }}>No chats yet for this resource.</div>
      <button
        onClick={onNew}
        style={{
          padding: "8px 14px",
          background: "var(--accent)",
          color: "var(--accent-fg)",
          border: "none",
          borderRadius: 7,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        + New chat
      </button>
    </div>
  );
}

function ChatThread({
  chatId,
  resourceType,
  currentPage,
  onJumpToPage,
  onChatRenamed,
}: {
  chatId: string;
  resourceType: "pdf" | "pptx" | "youtube" | "video";
  currentPage: number;
  onJumpToPage: (p: number) => void;
  onChatRenamed: () => void;
}) {
  const { data: initial = [] } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => api.listMessages(chatId),
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamBytes, setStreamBytes] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initial);
  }, [initial]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming, streamBytes]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || streaming) return;
    setInput("");
    setError(null);
    setStreaming(true);
    setStreamBytes(0);
    const anchor = resourceType === "pdf" ? { page: currentPage } : undefined;
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, anchor }),
      });
      if (!res.body) throw new Error("no response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let renamedNotified = false;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n\n")) >= 0) {
          const frame = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const ev = parseSSE(frame);
          if (!ev) continue;
          if (ev.event === "user_message") {
            const m = ev.data as ChatMessage;
            setMessages((cur) => [...cur, m]);
            if (!renamedNotified) {
              renamedNotified = true;
              onChatRenamed();
            }
          } else if (ev.event === "delta") {
            setStreamBytes((b) => b + ((ev.data as any).text?.length ?? 0));
          } else if (ev.event === "assistant_message") {
            const m = ev.data as ChatMessage;
            setMessages((cur) => [...cur, m]);
          } else if (ev.event === "error") {
            setError((ev.data as any).message || "error");
          }
        }
      }
    } catch (e: any) {
      setError(e?.message || "network error");
    } finally {
      setStreaming(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      send(input);
    }
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <>
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "22px 22px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        {messages.length === 0 && !streaming && (
          <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
            Ask anything about {resourceType === "pdf" ? `page ${currentPage}` : "this resource"}. The assistant
            grounds its answer in the surrounding content.
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} onJumpToPage={onJumpToPage} />
        ))}
        {streaming && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", color: "var(--muted)", fontSize: 12.5 }}>
            <div className="dot-pulse" style={{ width: 8, height: 8, borderRadius: 4, background: "var(--accent)" }} />
            Thinking… {streamBytes > 0 && <span className="mono">({streamBytes} chars)</span>}
          </div>
        )}
        {error && (
          <div
            style={{
              border: "1px solid #C2410C",
              background: "rgba(194,65,12,0.08)",
              color: "#C2410C",
              borderRadius: 7,
              padding: "8px 12px",
              fontSize: 12.5,
            }}
          >
            {error}
          </div>
        )}
        {!streaming && lastAssistant?.suggested_followups_json?.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--muted)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              Suggested
            </span>
            {lastAssistant.suggested_followups_json.map((f, i) => (
              <button
                key={i}
                onClick={() => send(f)}
                style={{
                  textAlign: "left",
                  padding: "9px 12px",
                  background: "transparent",
                  border: "1px solid var(--border-soft)",
                  borderRadius: 7,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  color: "var(--ink-soft)",
                  fontSize: 13,
                }}
              >
                <span className="mono" style={{ color: "var(--muted-2)", fontSize: 11, marginRight: 8 }}>→</span>
                {f}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div style={{ padding: "12px 14px 14px", borderTop: "1px solid var(--border-soft)", background: "var(--panel)" }}>
        <div
          style={{
            background: "var(--panel-2)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "10px 12px 8px",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder={`Ask about ${resourceType === "pdf" ? `page ${currentPage}` : "this resource"}…`}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "inherit",
              fontSize: 13.5,
              lineHeight: 1.5,
              resize: "none",
              color: "var(--ink)",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 6,
              paddingTop: 6,
              borderTop: "1px solid var(--border-soft)",
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--muted)",
                padding: "2px 7px",
                border: "1px solid var(--border-soft)",
                borderRadius: 99,
              }}
            >
              {resourceType === "pdf" ? `page ${currentPage} · ±3` : "context"}
            </span>
            <button
              onClick={() => send(input)}
              disabled={streaming || !input.trim()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 11px",
                background: streaming || !input.trim() ? "var(--panel-sunk)" : "var(--ink)",
                color: streaming || !input.trim() ? "var(--muted)" : "var(--bg)",
                border: "none",
                borderRadius: 6,
                cursor: streaming || !input.trim() ? "not-allowed" : "pointer",
                fontSize: 12,
                fontWeight: 500,
                fontFamily: "inherit",
              }}
            >
              Send <kbd style={{ background: "rgba(255,255,255,0.14)", border: "none", color: "inherit" }}>⌘↵</kbd>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function MessageBubble({
  message,
  onJumpToPage,
}: {
  message: ChatMessage;
  onJumpToPage: (p: number) => void;
}) {
  if (message.role === "user") {
    return (
      <div style={{ alignSelf: "flex-end", maxWidth: "88%" }}>
        <div
          style={{
            background: "var(--panel-sunk)",
            border: "1px solid var(--border-soft)",
            borderRadius: "12px 12px 4px 12px",
            padding: "10px 13px",
            fontSize: 13.5,
            color: "var(--ink)",
            lineHeight: 1.55,
            whiteSpace: "pre-wrap",
          }}
        >
          {message.content_text}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          background: "var(--accent)",
          color: "var(--accent-fg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        N
      </div>
      <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: "var(--ink)", lineHeight: 1.6 }}>
        {renderAssistantText(message.content_text, message.citations_json, onJumpToPage)}
      </div>
    </div>
  );
}

function renderAssistantText(
  text: string,
  citations: Citation[],
  onJumpToPage: (p: number) => void,
) {
  const out: React.ReactNode[] = [];
  let key = 0;
  text.split(/\n\n+/).forEach((para, pi) => {
    if (pi > 0) out.push(<div key={`gap-${key++}`} style={{ height: 8 }} />);
    const tokens = para.split(/(\*\*[^*]+\*\*|\[[^\]]+\])/g);
    out.push(
      <div key={`p-${key++}`}>
        {tokens.map((tok, i) => {
          if (tok.startsWith("**") && tok.endsWith("**"))
            return (
              <strong key={i} style={{ fontWeight: 600 }}>
                {tok.slice(2, -2)}
              </strong>
            );
          if (tok.startsWith("[") && tok.endsWith("]")) {
            const label = tok.slice(1, -1);
            const m = /page\s+(\d+)/i.exec(label);
            const page = m ? parseInt(m[1], 10) : null;
            return (
              <button
                key={i}
                onClick={() => page != null && onJumpToPage(page)}
                title={citations.find((c) => c.anchor.page === page)?.quote}
                className="mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "1px 6px",
                  margin: "0 1px",
                  background: "var(--accent-tint)",
                  border: "1px solid var(--accent-soft)",
                  borderRadius: 4,
                  color: "var(--accent)",
                  fontSize: 10.5,
                  cursor: page != null ? "pointer" : "default",
                  verticalAlign: "baseline",
                  fontWeight: 500,
                  fontFamily: "inherit",
                }}
              >
                {label}
              </button>
            );
          }
          return <span key={i}>{tok}</span>;
        })}
      </div>,
    );
  });
  return out;
}

function parseSSE(frame: string): { event: string; data: any } | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0) return null;
  const raw = dataLines.join("\n");
  try {
    return { event, data: JSON.parse(raw) };
  } catch {
    return { event, data: raw };
  }
}

