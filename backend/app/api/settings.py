from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.models import Settings as SettingsRow
from app.schemas import SettingsOut, SettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])


def _get_or_create(db: Session) -> SettingsRow:
    row = db.get(SettingsRow, 1)
    if row is None:
        row = SettingsRow(id=1)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def _to_out(row: SettingsRow) -> SettingsOut:
    return SettingsOut(
        chat_provider=row.chat_provider,
        chat_model=row.chat_model,
        summary_provider=row.summary_provider,
        summary_model=row.summary_model,
        pdf_context_pages=row.pdf_context_pages,
        ppt_context_slides=row.ppt_context_slides,
        video_context_seconds=row.video_context_seconds,
        whisper_model=row.whisper_model,
        has_google_key=bool(row.google_api_key),
        has_openai_key=bool(row.openai_api_key),
        has_anthropic_key=bool(row.anthropic_api_key),
    )


@router.get("", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db)) -> SettingsOut:
    return _to_out(_get_or_create(db))


@router.patch("", response_model=SettingsOut)
def update_settings(payload: SettingsUpdate, db: Session = Depends(get_db)) -> SettingsOut:
    row = _get_or_create(db)
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        # Allow empty string to clear an API key
        if k.endswith("_api_key") and v == "":
            setattr(row, k, None)
        else:
            setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return _to_out(row)
