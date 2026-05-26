import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { I } from "../lib/icons";

// pdfjs worker via CDN matched to the installed version
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

type Props = { fileUrl: string; title: string };

export function PdfViewer({ fileUrl, title }: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(640);
  const wrapRef = useRef<HTMLDivElement>(null);

  const file = useMemo(() => ({ url: fileUrl }), [fileUrl]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 640;
      setWidth(Math.min(820, Math.max(360, w - 60)));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const go = (n: number) => {
    if (!numPages) return;
    setPage(Math.max(1, Math.min(numPages, n)));
  };

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
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{title}</span>
        <span style={{ flex: 1 }} />
        <button onClick={() => go(page - 1)} style={iconBtn} aria-label="Previous page">
          <I.chevron style={{ transform: "rotate(180deg)" }} />
        </button>
        <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-soft)", padding: "0 6px" }}>
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>{page}</span>
          <span style={{ color: "var(--muted-2)" }}> / {numPages ?? "…"}</span>
        </span>
        <button onClick={() => go(page + 1)} style={iconBtn} aria-label="Next page">
          <I.chevron />
        </button>
      </div>

      <div
        ref={wrapRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "28px 0",
          display: "flex",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <Document
          file={file}
          onLoadSuccess={(d) => setNumPages(d.numPages)}
          loading={<Hint>Loading PDF…</Hint>}
          error={<Hint error>Failed to load PDF.</Hint>}
        >
          {numPages != null && (
            <Page
              pageNumber={page}
              width={width}
              renderTextLayer
              renderAnnotationLayer={false}
              loading={<Hint>Rendering page…</Hint>}
            />
          )}
        </Document>
      </div>
    </>
  );
}

function Hint({ children, error }: { children: React.ReactNode; error?: boolean }) {
  return (
    <div
      style={{
        padding: "40px 24px",
        color: error ? "#B83232" : "var(--muted)",
        fontSize: 13.5,
      }}
    >
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
