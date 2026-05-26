import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { I } from "../lib/icons";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

type Props = { fileUrl: string; title: string };

const PRELOAD_AHEAD = 2;
const PRELOAD_BEHIND = 1;
const INPUT_DIGIT_PX = 10;
const INPUT_PAD_PX = 20;
const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;

export function PdfViewer({ fileUrl, title }: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [inputVal, setInputVal] = useState("1");
  const [baseWidth, setBaseWidth] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panStart = useRef<{ x: number; y: number; scrollX: number; scrollY: number } | null>(null);

  const file = useMemo(() => ({ url: fileUrl }), [fileUrl]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const byHeight = Math.floor((h - 56) / 1.414);
      const byWidth = Math.floor(w - 48);
      setBaseWidth(Math.min(byHeight, byWidth, 960));
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ctrl+scroll or pinch to zoom
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setScale((s) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, parseFloat((s + delta).toFixed(2)))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const go = (n: number) => {
    if (!numPages) return;
    const next = Math.max(1, Math.min(numPages, n));
    setPage(next);
    setInputVal(String(next));
  };

  const handleInputCommit = () => {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n)) go(n);
    else setInputVal(String(page));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
    if (e.key === "Escape") { setInputVal(String(page)); (e.target as HTMLInputElement).blur(); }
  };

  const zoom = (delta: number) => {
    setScale((s) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, parseFloat((s + delta).toFixed(2)))));
  };

  const resetZoom = () => setScale(1);

  // middle-click or space+drag to pan
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    // middle mouse or left mouse (always allow drag-to-pan)
    if (e.button === 1 || e.button === 0) {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, scrollX: el.scrollLeft, scrollY: el.scrollTop };
      e.preventDefault();
    }
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || !panStart.current || !wrapRef.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    wrapRef.current.scrollLeft = panStart.current.scrollX - dx;
    wrapRef.current.scrollTop = panStart.current.scrollY - dy;
  }, [isPanning]);

  const onMouseUp = useCallback(() => {
    setIsPanning(false);
    panStart.current = null;
  }, []);

  const preloadPages = useMemo(() => {
    if (!numPages) return [];
    const pages: number[] = [];
    for (let i = page - PRELOAD_BEHIND; i <= page + PRELOAD_AHEAD; i++) {
      if (i >= 1 && i <= numPages && i !== page) pages.push(i);
    }
    return pages;
  }, [page, numPages]);

  const digits = Math.max(inputVal.length, String(numPages ?? page).length, 2);
  const inputWidth = digits * INPUT_DIGIT_PX + INPUT_PAD_PX;
  const renderWidth = baseWidth != null ? Math.round(baseWidth * scale) : null;

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          background: "var(--panel)",
          borderBottom: "1px solid var(--border-soft)",
          minHeight: 44,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{title}</span>
        <span style={{ flex: 1 }} />

        {/* zoom controls */}
        <button onClick={() => zoom(-ZOOM_STEP)} style={iconBtn} aria-label="Zoom out" title="Zoom out">
          <MinusIcon />
        </button>
        <button
          onClick={resetZoom}
          style={{ ...iconBtn, width: "auto", padding: "0 6px", fontSize: 11, fontWeight: 600, color: scale === 1 ? "var(--muted-2)" : "var(--ink-soft)", fontFamily: "inherit" }}
          aria-label="Reset zoom"
          title="Reset zoom"
        >
          {Math.round(scale * 100)}%
        </button>
        <button onClick={() => zoom(ZOOM_STEP)} style={iconBtn} aria-label="Zoom in" title="Zoom in">
          <PlusIcon />
        </button>

        <div style={{ width: 1, height: 16, background: "var(--border-soft)", margin: "0 4px" }} />

        {/* page controls */}
        <button onClick={() => go(page - 1)} style={iconBtn} aria-label="Previous page">
          <I.chevron style={{ transform: "rotate(180deg)" }} />
        </button>
        <span style={{ fontSize: 12, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 6, padding: "0 4px" }}>
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onFocus={(e) => {
              e.target.select();
              e.target.style.borderColor = "var(--accent, #6366f1)";
              e.target.style.boxShadow = "0 0 0 2px color-mix(in srgb, var(--accent, #6366f1) 20%, transparent)";
            }}
            onBlur={(e) => {
              handleInputCommit();
              e.target.style.borderColor = "var(--border-soft)";
              e.target.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.06)";
            }}
            style={{
              width: inputWidth,
              textAlign: "center",
              fontWeight: 600,
              fontSize: 13,
              color: "var(--ink)",
              background: "var(--bg)",
              border: "1px solid var(--border-soft)",
              borderRadius: 6,
              fontFamily: "inherit",
              padding: "3px 6px",
              outline: "none",
              cursor: "text",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            aria-label="Current page"
          />
          <span style={{ color: "var(--muted-2)", fontSize: 12 }}>/ {numPages ?? "…"}</span>
        </span>
        <button onClick={() => go(page + 1)} style={iconBtn} aria-label="Next page">
          <I.chevron />
        </button>
      </div>

      <div
        ref={wrapRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          flex: 1,
          overflow: "auto",
          padding: "28px 24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          background: "transparent",
          position: "relative",
          cursor: isPanning ? "grabbing" : "grab",
          userSelect: "none",
        }}
      >
        <Document
          file={file}
          onLoadSuccess={(d) => setNumPages(d.numPages)}
          loading={<Hint>Loading PDF…</Hint>}
          error={<Hint error>Failed to load PDF.</Hint>}
        >
          {numPages != null && renderWidth != null && (
            <>
              <Page
                pageNumber={page}
                width={renderWidth}
                renderTextLayer
                renderAnnotationLayer={false}
                loading={<Hint>Rendering page…</Hint>}
              />
              {preloadPages.map((p) => (
                <div key={p} style={{ position: "absolute", top: 0, left: -9999, pointerEvents: "none", visibility: "hidden" }}>
                  <Page
                    pageNumber={p}
                    width={renderWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={null}
                  />
                </div>
              ))}
            </>
          )}
        </Document>
      </div>
    </>
  );
}

function MinusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Hint({ children, error }: { children: React.ReactNode; error?: boolean }) {
  return (
    <div style={{ padding: "40px 24px", color: error ? "#B83232" : "var(--muted)", fontSize: 13.5 }}>
      {children}
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 26,
  height: 26,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--ink-soft)",
  borderRadius: 6,
};
