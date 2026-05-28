from __future__ import annotations

import logging
from pathlib import Path

import fitz  # pymupdf
from sqlalchemy.orm import Session

from app.db.base import SessionLocal
from app.db.models import Resource, ResourceContent

log = logging.getLogger(__name__)

# A page is treated as "needs OCR" when stripped text is shorter than this.
OCR_MIN_CHARS = 40
# If embedded raster images cover more than this fraction of the page area,
# treat the page as scanned and OCR it regardless of text length. This catches
# the common case where a scanned page also has overlaid printed boilerplate
# (page numbers, headers) that would otherwise defeat the char-count check.
OCR_IMAGE_AREA_RATIO = 0.4
OCR_DPI = 300


def _page_image_area_ratio(page: fitz.Page) -> float:
    page_area = float(page.rect.width * page.rect.height) or 1.0
    total = 0.0
    try:
        for info in page.get_image_info():
            bbox = info.get("bbox")
            if not bbox:
                continue
            x0, y0, x1, y1 = bbox
            total += max(0.0, x1 - x0) * max(0.0, y1 - y0)
    except Exception:
        return 0.0
    return total / page_area


def _extract_page_text(page: fitz.Page) -> tuple[str, str]:
    """Return (text, source) where source is 'text' | 'ocr' | 'ocr_failed'."""
    text = (page.get_text("text") or "").strip()
    image_ratio = _page_image_area_ratio(page)
    needs_ocr = len(text) < OCR_MIN_CHARS or image_ratio >= OCR_IMAGE_AREA_RATIO

    if not needs_ocr:
        return text, "text"

    try:
        tp = page.get_textpage_ocr(flags=0, language="eng", dpi=OCR_DPI, full=True)
        ocr_text = (page.get_text("text", textpage=tp) or "").strip()
        tp = None
        # Merge: OCR'd content plus any printed text (headers/captions) that
        # the OCR pass might have missed.
        if ocr_text and text and text not in ocr_text:
            return f"{ocr_text}\n\n{text}", "ocr"
        if ocr_text:
            return ocr_text, "ocr"
        return text, "text"
    except Exception:
        log.exception("OCR failed for page %s", page.number)
        return text, "ocr_failed"


def ingest_pdf(resource_id: str) -> None:
    """Extract per-page text from a PDF resource. Runs in a BackgroundTask.

    Falls back to Tesseract OCR (via PyMuPDF) for pages that look scanned —
    either little extractable text, or mostly covered by raster images.
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
