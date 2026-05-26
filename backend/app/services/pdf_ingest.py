from __future__ import annotations

import logging
from pathlib import Path

import fitz  # pymupdf
from sqlalchemy.orm import Session

from app.db.base import SessionLocal
from app.db.models import Resource, ResourceContent

log = logging.getLogger(__name__)


def ingest_pdf(resource_id: str) -> None:
    """Extract per-page text from a PDF resource. Runs in a BackgroundTask."""
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
            for i, page in enumerate(doc):
                text = page.get_text("text") or ""
                db.add(
                    ResourceContent(
                        resource_id=resource.id,
                        anchor_json={"page": i + 1},
                        content_text=text,
                        order_index=i,
                    )
                )
            doc.close()

            resource.resource_metadata = {**(resource.resource_metadata or {}), "page_count": page_count}
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
