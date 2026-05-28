from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional, Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Resource, ResourceContent


@dataclass
class ContextItem:
    anchor: dict
    text: str


@dataclass
class ContextBundle:
    items: list[ContextItem] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)


class Retriever(Protocol):
    def get_context(
        self,
        db: Session,
        resource: Resource,
        anchor: Optional[dict],
        query: str,
    ) -> ContextBundle: ...


class RecentWindowRetrieval:
    """Window around the anchor. v0 ignores `query`."""

    def __init__(self, pdf_pages: int = 3, ppt_slides: int = 2, video_seconds: int = 90):
        self.pdf_pages = pdf_pages
        self.ppt_slides = ppt_slides
        self.video_seconds = video_seconds

    def get_context(
        self,
        db: Session,
        resource: Resource,
        anchor: Optional[dict],
        query: str,
    ) -> ContextBundle:
        if resource.type == "pdf":
            return self._pdf(db, resource, anchor)
        # Stage 2 covers PDFs only; future types handled by later stages.
        return ContextBundle(items=[], metadata={"strategy": "recent-window", "note": "type not supported yet"})

    def _pdf(self, db: Session, resource: Resource, anchor: Optional[dict]) -> ContextBundle:
        page = (anchor or {}).get("page") if anchor else None
        if page is None:
            # default: first page
            page = 1
        lo = max(1, int(page) - self.pdf_pages)
        hi = int(page) + self.pdf_pages
        rows = db.execute(
            select(ResourceContent)
            .where(ResourceContent.resource_id == resource.id)
            .order_by(ResourceContent.order_index)
        ).scalars().all()
        items: list[ContextItem] = []
        for rc in rows:
            p = (rc.anchor_json or {}).get("page")
            if p is None or p < lo or p > hi:
                continue
            items.append(ContextItem(anchor={"page": p}, text=rc.content_text or ""))
        return ContextBundle(
            items=items,
            metadata={"strategy": "recent-window", "anchor_page": page, "range": [lo, hi]},
        )
