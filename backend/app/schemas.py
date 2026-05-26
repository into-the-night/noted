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
