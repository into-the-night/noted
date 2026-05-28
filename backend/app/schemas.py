from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class ProjectUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class ProjectOut(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime
    resource_count: int = 0

    class Config:
        from_attributes = True


class ChatCreate(BaseModel):
    resource_id: str
    name: Optional[str] = None


class ChatOut(BaseModel):
    id: str
    project_id: str
    resource_id: str
    name: str
    is_pinned: bool = False
    anchor_json: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageOut(BaseModel):
    id: str
    chat_id: str
    role: str
    content_text: str
    citations_json: list = []
    suggested_followups_json: list = []
    created_at: datetime

    class Config:
        from_attributes = True


class MessagePost(BaseModel):
    content: str = Field(min_length=1)
    anchor: Optional[dict] = None


class SettingsOut(BaseModel):
    chat_provider: str
    chat_model: str
    summary_provider: str
    summary_model: str
    pdf_context_pages: int
    ppt_context_slides: int
    video_context_seconds: int
    whisper_model: str
    has_google_key: bool
    has_openai_key: bool
    has_anthropic_key: bool


class SettingsUpdate(BaseModel):
    google_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    chat_provider: Optional[str] = None
    chat_model: Optional[str] = None
    summary_provider: Optional[str] = None
    summary_model: Optional[str] = None
    pdf_context_pages: Optional[int] = None
    ppt_context_slides: Optional[int] = None
    video_context_seconds: Optional[int] = None


class ResourceOut(BaseModel):
    id: str
    project_id: str
    type: str
    title: str
    ingestion_status: str
    ingestion_error: Optional[str] = None
    metadata: dict = {}
    created_at: datetime

    class Config:
        from_attributes = True
