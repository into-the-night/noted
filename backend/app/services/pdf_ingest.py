from __future__ import annotations

import logging
from pathlib import Path

import fitz  # pymupdf
from sqlalchemy.orm import Session

from app.db.base import SessionLocal
from app.db.models import Resource, ResourceContent

log = logging.getLogger(__name__)

# A page is treated as "needs OCR" when stripped text is shorter than this.
# Image-only / scanned pages typically return 0–20 chars (page numbers, stray glyphs).
OCR_MIN_CHARS = 40
OCR_DPI = 300


def _extract_page_text(page: fitz.Page) -> tuple[str, str]:
    """Return (text, source) where source is 'text' or 'ocr' or 'ocr_failed'."""
    text = (page.get_text("text") or "").strip()
    if len(text) >= OCR_MIN_CHARS:
        return text, "text"

    try:
        tp = page.get_textpage_ocr(flags=0, language="eng", dpi=OCR_DPI, full=True)
        ocr_text = (page.get_text("text", textpage=tp) or "").strip()
        tp = None
        if len(ocr_text) > len(text):
            return ocr_text, "ocr"
        return text, "text"
    except Exception:
        log.exception("OCR failed for page %s", page.number)
        return text, "ocr_failed"


def ingest_pdf(resource_id: str) -> None:
    """Extract per-page text from a PDF resource. Runs in a BackgroundTask.

    Falls back to Tesseract OCR (via PyMuPDF) for pages with little/no extractable text,
    so image-only or scanned PDFs still produce usable content.
    """
    db: Session = SessionLocal()
    try:
        resource = db.get(Resource, resource_id)
        if resource is None or resource.source_path is None:
            return
        resource.ingestion_status = "processing"
        db.commit()

        try:
            path = Path(resource.source_path)
            doc = fitz.open(path)
            page_count = doc.page_count
            ocr_pages = 0
            for i, page in enumerate(doc):
                text, source = _extract_page_text(page)
                if source == "ocr":
                    ocr_pages += 1
                db.add(
                    ResourceContent(
                        resource_id=resource.id,
                        anchor_json={"page": i + 1, "source": source},
                        content_text=text,
                        order_index=i,
                    )
                )
            doc.close()

            resource.resource_metadata = {
                **(resource.resource_metadata or {}),
                "page_count": page_count,
                "ocr_pages": ocr_pages,
            }
            resource.ingestion_status = "ready"
            resource.ingestion_error = None
            db.commit()
        except Exception as e:
            log.exception("PDF ingestion failed for %s", resource_id)
            resource.ingestion_status = "failed"
            resource.ingestion_error = str(e)
            db.commit()
    finally:
        db.close()
