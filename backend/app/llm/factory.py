from __future__ import annotations

from sqlalchemy.orm import Session

from app.db.models import Settings as SettingsRow
from app.llm.base import LLMClient
from app.llm.gemini import GeminiClient


def _get_settings_row(db: Session) -> SettingsRow:
    row = db.get(SettingsRow, 1)
    if row is None:
        row = SettingsRow(id=1)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def get_chat_client(db: Session) -> tuple[LLMClient, str]:
    row = _get_settings_row(db)
    provider = row.chat_provider or "google"
    if provider == "google":
        return GeminiClient(api_key=row.google_api_key or ""), row.chat_model
    raise ValueError(f"Unsupported provider for v0: {provider}")
