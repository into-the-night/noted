# Noted — Build Roadmap

Cross-session progress tracker. Update the **Status** and **Notes** of each stage as you go. Each stage ends with a manual smoke test described under **Verify**.

**Decisions locked:**
- Frontend: React + Vite + TypeScript
- Backend: FastAPI + SQLAlchemy + Postgres
- Deployment: Docker Compose
- LLM v0: **Gemini** only, behind `LLMClient` abstraction
- Theme: white + dark-blue (`navy` palette) with dotted background (`data-bg="paper"`)
- M1 must-haves: PDF + chat + pin, then starring + revision view

**Source of truth:**
- Spec: `PRD.md`
- Design reference: `Noted v2.html`, `noted-app-v2.jsx`
- This file: stage tracker

Status legend: `⬜ not started · 🟡 in progress · ✅ done · ⏭ deferred`

---

## Stage 0 — Scaffold ✅

**Goal:** `docker compose up` boots an empty React app + FastAPI + Postgres.

- [x] `docker-compose.yml`, `.env.example`, `.gitignore`
- [x] Backend: Dockerfile, FastAPI, SQLAlchemy engine, Alembic config, `/api/health`
- [x] Frontend: Vite + TS + React, design tokens ported (navy palette default, dotted bg default)
- [x] Shell components: `TopBar`, `HomeView`, `ProjectView`, `ResourceView` (mock-data driven)
- [x] API status pill confirms backend connectivity

**Verify:** Home view shows mocked projects on navy/dotted theme; `/api/health` returns `{status:"ok", db:true}`.

**Notes:**

---

## Stage 1 — Projects & PDF resources ⬜

**Goal:** Real persistence. Upload a PDF, see it in the viewer.

- [ ] Alembic migration: `projects`, `resources`, `resource_content` (PRD §9)
- [ ] SQLAlchemy models in `backend/app/db/models.py`
- [ ] Endpoints: `POST/GET/PATCH/DELETE /api/projects`, `POST /api/projects/:id/resources`, `GET /api/resources/:id`, `GET /api/resources/:id/file`
- [ ] Ingestion: `pymupdf` → `resource_content` rows with `anchor_json = {page: N}`; status state machine via `BackgroundTasks`
- [ ] File storage at `/data/resources/{resource_id}/`
- [ ] Frontend: React Query, swap mocks in `HomeView` / `ProjectView`, real `UploadModal`
- [ ] `PdfViewer` with `react-pdf`

**Verify:** Create project → upload PDF → status `ready` → opening renders the actual file with page navigation; survives `docker compose down && up`.

**Notes:**

---

## Stage 2 — Chat with Gemini + recent-window retrieval ⬜

**Goal:** Unpinned chat against the current PDF page, streaming + citations.

- [ ] `LLMClient` Protocol + `GeminiClient` (`google-generativeai`)
- [ ] `Retriever` Protocol + `RecentWindowRetrieval` (PDF: page ±3)
- [ ] DB: `chats`, `messages`, `resource_tab_state`, single-row `settings`
- [ ] Endpoints: create chat, list chats per resource, post message (SSE stream), persist with `citations_json` + `suggested_followups_json`
- [ ] System prompt + JSON response format (PRD Appendix F)
- [ ] Frontend: port `ChatPanel`, tab strip, citation chips that jump the viewer, suggested-followup buttons
- [ ] Debounced "current location" sent with each message
- [ ] Minimal Settings page: API key + Gemini model dropdown

**Verify:** Open PDF → new chat → streamed answer → citation chips navigate the viewer.

**Notes:**

---

## Stage 3 — Pinning & session restore ⬜

**Goal:** PRD §6.4 pinned-chat model end-to-end.

- [ ] DB: `chats.is_pinned`, `chats.anchor_json`
- [ ] Pin button state machine (Pin → Pinned ✓ → two-step unpin/repin)
- [ ] Pinned-chat margin indicator in `PdfViewer`; popover for multiple chats at one anchor
- [ ] Tab lifecycle: unpinned-closed = discard; pinned-closed = persist + retrievable via anchor
- [ ] `resource_tab_state` save/restore on close/open
- [ ] Unit tests for the state machine

**Verify:** Pin chat to p.47 → close resource → reopen → tabs restored; navigate to p.47 → indicator → open from popover.

**Notes:**

---

## Stage 4 — Starring & revision view ⬜

**Goal:** One-tap stars, AI summaries, project revision feed.

- [ ] DB: `stars`, `lists`, `list_stars`, `card_chats`
- [ ] Endpoints: stars CRUD + filters, lists CRUD, card-chat messages
- [ ] Star entry points: PDF page, PDF selection, chat full, chat message full, chat message selection
- [ ] AI summary worker (PRD Appendix A prompts) with deterministic fallback
- [ ] Star creation popup (single "Add to list" field, Enter saves)
- [ ] Revision tab: card feed, filters (resource/type/list), group toggle
- [ ] Expanded card view with "Ask about this" and "Go to source"

**Verify:** Star a page + a chat message → revision tab shows both with AI summaries → "Go to source" navigates → "Ask about this" creates isolated card chat.

**Notes:**

---

## Stage 5 — PPT support ⬜

**Goal:** `.pptx` upload, slide-by-slide viewer, slide-anchored chat + stars.

- [ ] `python-pptx` per-slide text; LibreOffice headless renders slides to PNG
- [ ] `resource_content` rows with `{slide: N}`
- [ ] `PptViewer` with thumbnail sidebar, star slide entry point
- [ ] Retrieval window: slide ±2

**Verify:** Upload `.pptx` → slides render → pin to slide 12 → star slide → mirrors PDF behavior.

**Notes:**

---

## Stage 6 — Video & YouTube ⬜

**Goal:** Timestamp-anchored chat and stars for video content.

- [ ] `youtube-transcript-api` for YouTube (fail gracefully without captions)
- [ ] `faster-whisper` for uploaded video (configurable model)
- [ ] Transcript segments with `t_start`/`t_end`
- [ ] `VideoViewer` (HTML5 + YouTube iframe API), transcript pane, current-segment highlight
- [ ] Timestamp star + timestamp pin
- [ ] Retrieval window: ±90s
- [ ] Per-resource transcription progress, non-blocking

**Verify:** YouTube URL with captions → chat with timestamps; uploaded video → progress shown → chat works once transcribed.

**Notes:**

---

## Stage 7 — Multi-provider, polish, hardening ⬜

**Goal:** PRD parity + production polish.

- [ ] `OpenAIClient`, `AnthropicClient` behind existing interface
- [ ] Settings: per-use-case provider/model (chat vs summary), context-window overrides, Whisper model size, optional single-password gate
- [ ] Toasts, error states, rate-limit backoff
- [ ] Keyboard shortcuts
- [ ] Cross-project "Recent stars" rollup on Home

**Verify:** Switch provider in settings → chat works. Bad key → clear inline error. App survives container restart with no data loss.

**Notes:**

---

## Per-stage definition of done

1. Endpoints + frontend wired end-to-end (no mocks left for the stage's scope)
2. Backend: pytest covering endpoint + ingestion happy paths
3. Frontend: component tests for any new state machine / parsing logic
4. Manual smoke test passes (the **Verify** section)
5. `docker compose down && up` — data persists
6. Update this file: tick boxes, change Status, add **Notes** (gotchas, decisions, leftover TODOs)

## Resuming a session

1. Open this file, find the first non-✅ stage.
2. Re-read its **Goal** and unchecked checklist items.
3. Skim **Notes** from prior stages for context.
4. Reference `PRD.md` for spec details (especially Appendices A/B/D/E/F).
