from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.db.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now, nullable=False)

    resources: Mapped[list["Resource"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(
        PG_UUID(as_uuid=False), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    type: Mapped[str] = mapped_column(String(16), nullable=False)  # 'pdf' | 'pptx' | 'youtube' | 'video'
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    source_path: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ingestion_status: Mapped[str] = mapped_column(String(16), nullable=False, default="queued")
    ingestion_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resource_metadata: Mapped[dict] = mapped_column("metadata_json", JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, nullable=False)

    project: Mapped[Project] = relationship(back_populates="resources")
    contents: Mapped[list["ResourceContent"]] = relationship(
        back_populates="resource", cascade="all, delete-orphan"
    )


class ResourceContent(Base):
    __tablename__ = "resource_content"

    id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), primary_key=True, default=_uuid)
    resource_id: Mapped[str] = mapped_column(
        PG_UUID(as_uuid=False), ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True
    )
    anchor_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    content_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    resource: Mapped[Resource] = relationship(back_populates="contents")
