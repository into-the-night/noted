from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, Integer, String, Text, DateTime, JSON, Boolean
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


class Settings(Base):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    openai_api_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    anthropic_api_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    google_api_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    chat_provider: Mapped[str] = mapped_column(String(16), nullable=False, default="google")
    chat_model: Mapped[str] = mapped_column(String(64), nullable=False, default="gemini-2.5-flash")
    summary_provider: Mapped[str] = mapped_column(String(16), nullable=False, default="google")
    summary_model: Mapped[str] = mapped_column(String(64), nullable=False, default="gemini-2.5-flash")
    pdf_context_pages: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    ppt_context_slides: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    video_context_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=90)
    whisper_model: Mapped[str] = mapped_column(String(16), nullable=False, default="small")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now, nullable=False)


class Chat(Base):
    __tablename__ = "chats"

    id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(
        PG_UUID(as_uuid=False), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    resource_id: Mapped[str] = mapped_column(
        PG_UUID(as_uuid=False), ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False, default="New chat")
    is_pinned: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    anchor_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now, nullable=False)

    messages: Mapped[list["Message"]] = relationship(
        back_populates="chat", cascade="all, delete-orphan", order_by="Message.created_at"
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), primary_key=True, default=_uuid)
    chat_id: Mapped[str] = mapped_column(
        PG_UUID(as_uuid=False), ForeignKey("chats.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(16), nullable=False)  # 'user' | 'assistant'
    content_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    citations_json: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    suggested_followups_json: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, nullable=False)

    chat: Mapped[Chat] = relationship(back_populates="messages")


class ResourceTabState(Base):
    __tablename__ = "resource_tab_state"

    resource_id: Mapped[str] = mapped_column(
        PG_UUID(as_uuid=False), ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True
    )
    open_chat_ids: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    active_chat_id: Mapped[Optional[str]] = mapped_column(PG_UUID(as_uuid=False), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now, nullable=False)
