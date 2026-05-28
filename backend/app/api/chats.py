from __future__ import annotations

import json
import logging
import re
from typing import AsyncIterator, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import SessionLocal, get_db
from app.db.models import Chat, Message, Resource
from app.llm import Message as LLMMessage
from app.llm.factory import get_chat_client
from app.schemas import ChatCreate, ChatOut, MessageOut, MessagePost
from app.services.retrieval import RecentWindowRetrieval

log = logging.getLogger(__name__)

router = APIRouter(tags=["chats"])


def _to_chat_out(c: Chat) -> ChatOut:
    return ChatOut(
        id=c.id,
        project_id=c.project_id,
        resource_id=c.resource_id,
        name=c.name,
        is_pinned=c.is_pinned,
        anchor_json=c.anchor_json,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


def _to_msg_out(m: Message) -> MessageOut:
    return MessageOut(
        id=m.id,
        chat_id=m.chat_id,
        role=m.role,
        content_text=m.content_text,
        citations_json=m.citations_json or [],
        suggested_followups_json=m.suggested_followups_json or [],
        created_at=m.created_at,
    )


@router.get("/api/resources/{resource_id}/chats", response_model=list[ChatOut])
def list_chats(resource_id: str, db: Session = Depends(get_db)) -> list[ChatOut]:
    if not db.get(Resource, resource_id):
        raise HTTPException(404, "resource not found")
    rows = db.execute(
        select(Chat).where(Chat.resource_id == resource_id).order_by(Chat.created_at)
    ).scalars().all()
    return [_to_chat_out(c) for c in rows]


@router.post("/api/chats", response_model=ChatOut, status_code=201)
def create_chat(payload: ChatCreate, db: Session = Depends(get_db)) -> ChatOut:
    r = db.get(Resource, payload.resource_id)
    if not r:
        raise HTTPException(404, "resource not found")
    c = Chat(
        project_id=r.project_id,
        resource_id=r.id,
        name=(payload.name or "New chat")[:200],
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return _to_chat_out(c)


@router.get("/api/chats/{chat_id}/messages", response_model=list[MessageOut])
def list_messages(chat_id: str, db: Session = Depends(get_db)) -> list[MessageOut]:
    c = db.get(Chat, chat_id)
    if not c:
        raise HTTPException(404, "chat not found")
    rows = db.execute(
        select(Message).where(Message.chat_id == chat_id).order_by(Message.created_at)
    ).scalars().all()
    return [_to_msg_out(m) for m in rows]


SYSTEM_TEMPLATE = """You are a study assistant helping a student learn. You can answer general questions from your own knowledge AND ground answers in the material the student is currently reading or watching.

The student is studying "{title}". Below is the extracted content from the part of the resource they are currently engaged with. This content may be imperfect (e.g. OCR from handwritten notes), so treat it as a hint about what the student is looking at, not as the absolute truth.

CONTENT:
---
{content}
---

Rules:
1. If the question is clearly about the material above, ground your answer in it and cite locations inline using bracket markers like [page 47]. If the content doesn't actually contain what's needed, say so briefly and then answer from general knowledge anyway — do not refuse just because the snippet is empty or noisy.
2. If the question is general (not about the specific material), just answer it normally from your own knowledge. No citations needed in that case.
3. The student may write in English, Hindi, or Hinglish (mixed English-Hindi). Respond in whichever style matches their input.
4. Be concise. Aim for a focused answer rather than a comprehensive lecture.
5. Suggest 2-3 useful follow-up questions the student could ask next.
6. For citation "quote" fields: only include a quote if it's a clean, readable phrase from the content. If the content for a page is just noisy OCR fragments, either omit that citation entirely or use a short paraphrase (under 80 chars) describing what's on the page — never paste raw OCR garbage into the quote. Keep quote strings free of unescaped quotes, newlines, and control characters.

Respond as a JSON object with this exact shape:
{{
  "answer": "...your answer in markdown, with citation references like [page 47] inline...",
  "citations": [
    {{"type": "pdf_page", "anchor": {{"page": 47}}, "quote": "exact text from the content that supports this citation"}}
  ],
  "suggested_followups": ["...", "...", "..."]
}}
"""


def _render_content(items) -> str:
    parts = []
    for it in items:
        anchor = it.anchor
        if "page" in anchor:
            tag = f"[page {anchor['page']}]"
        elif "slide" in anchor:
            tag = f"[slide {anchor['slide']}]"
        elif "t_seconds" in anchor:
            tag = f"[t={anchor['t_seconds']}s]"
        else:
            tag = "[?]"
        text = (it.text or "").strip()
        if not text:
            continue
        parts.append(f"{tag}\n{text}")
    return "\n\n".join(parts) if parts else "(no content extracted)"


def _build_history(messages: list[Message]) -> list[LLMMessage]:
    out: list[LLMMessage] = []
    for m in messages:
        if m.role not in ("user", "assistant"):
            continue
        out.append(LLMMessage(role=m.role, content=m.content_text))
    return out


def _sse(event: str, data: dict | str) -> str:
    payload = data if isinstance(data, str) else json.dumps(data)
    return f"event: {event}\ndata: {payload}\n\n"


def _parse_assistant_json(raw: str) -> dict:
    """Best-effort: parse the model's JSON; fall back to a plain-text shape."""
    s = (raw or "").strip()
    # Strip code fences if present
    if s.startswith("```"):
        s = s.strip("`")
        if s.lower().startswith("json"):
            s = s[4:]
        s = s.strip()
    try:
        obj = json.loads(s)
        if isinstance(obj, dict) and "answer" in obj:
            return {
                "answer": str(obj.get("answer") or ""),
                "citations": obj.get("citations") or [],
                "suggested_followups": obj.get("suggested_followups") or [],
            }
    except Exception:
        pass

    # JSON parse failed — usually because the model embedded unescaped quotes
    # or control chars inside a string value (common when quoting noisy OCR).
    # Salvage the "answer" field with a regex; drop citations/followups since
    # we can't trust their structure.
    m = re.search(r'"answer"\s*:\s*"((?:[^"\\]|\\.)*)"', s, re.DOTALL)
    if m:
        try:
            answer = json.loads(f'"{m.group(1)}"')
        except Exception:
            answer = m.group(1)
        return {"answer": answer, "citations": [], "suggested_followups": []}

    return {"answer": raw, "citations": [], "suggested_followups": []}


@router.post("/api/chats/{chat_id}/messages")
async def post_message(chat_id: str, payload: MessagePost):
    """Stream an assistant response as Server-Sent Events.

    Manages its own DB session because the streaming generator outlives the request DI scope.
    """

    async def event_stream() -> AsyncIterator[str]:
        db: Session = SessionLocal()
        try:
            chat = db.get(Chat, chat_id)
            if not chat:
                yield _sse("error", {"message": "chat not found"})
                return
            resource = db.get(Resource, chat.resource_id)
            if not resource:
                yield _sse("error", {"message": "resource not found"})
                return

            # 1. Persist user message
            user_msg = Message(chat_id=chat.id, role="user", content_text=payload.content)
            db.add(user_msg)
            # Auto-name chat from first user message
            if (chat.name or "").strip() in ("", "New chat"):
                chat.name = payload.content.strip().split("\n")[0][:40] or "New chat"
            db.commit()
            db.refresh(user_msg)
            yield _sse("user_message", _to_msg_out(user_msg).model_dump(mode="json"))

            # 2. Build context
            anchor: Optional[dict] = payload.anchor
            if chat.is_pinned and chat.anchor_json:
                anchor = chat.anchor_json
            retriever = RecentWindowRetrieval()
            bundle = retriever.get_context(db, resource, anchor, payload.content)
            system_prompt = SYSTEM_TEMPLATE.format(
                title=resource.title,
                content=_render_content(bundle.items),
            )

            # 3. Load prior chat history
            history_rows = db.execute(
                select(Message).where(Message.chat_id == chat.id).order_by(Message.created_at)
            ).scalars().all()
            llm_messages: list[LLMMessage] = [LLMMessage(role="system", content=system_prompt)]
            llm_messages.extend(_build_history(history_rows))

            # 4. Call LLM with JSON response format, streaming raw JSON tokens
            try:
                client, model = get_chat_client(db)
            except Exception as e:
                log.exception("LLM client error")
                yield _sse("error", {"message": str(e)})
                return

            raw = ""
            try:
                async for chunk in client.chat(
                    messages=llm_messages,
                    model=model,
                    temperature=0.6,
                    response_format="json",
                    stream=True,
                ):
                    raw += chunk.text
                    yield _sse("delta", {"text": chunk.text})
            except Exception as e:  # noqa: BLE001
                log.exception("LLM stream error")
                yield _sse("error", {"message": str(e)})
                return

            parsed = _parse_assistant_json(raw)
            assistant_msg = Message(
                chat_id=chat.id,
                role="assistant",
                content_text=parsed["answer"],
                citations_json=parsed["citations"],
                suggested_followups_json=parsed["suggested_followups"],
            )
            db.add(assistant_msg)
            db.commit()
            db.refresh(assistant_msg)

            yield _sse("assistant_message", _to_msg_out(assistant_msg).model_dump(mode="json"))
            yield _sse("done", {})
        finally:
            db.close()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
