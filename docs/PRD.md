# PRD: Study Workspace — v0 (Stage 1)

**Status:** Draft for implementation
**Distribution model:** Self-hosted. User runs the app on their own machine, supplies their own API keys for LLM providers.
**Scope:** Resource-level AI study assistant with pinned chats, starring, and revision lists. No canvas, no cross-resource chat, no planner agent. Those come in later stages.

---

## 1. Product summary

A self-hosted study workspace where a student creates **projects** (one per subject, exam, or unit), uploads or links **resources** (PDFs, PPTs, YouTube videos, uploaded videos), and chats with an AI assistant that has context of the resource around their current location. Chats can be **pinned** to specific pages, timestamps, or slides so they surface again when the student returns to that spot. Anything the student finds important — a PDF page, a video timestamp, a slide, an AI message, a text selection in chat — can be **starred** with one tap and surfaces later in a **revision view** built from those stars.

This is not a generic chat-with-PDF tool. The core insight is that students lose information across sessions: chats forgotten, important pages unmarked, and review-time becomes archaeology. Stage 1 solves two problems:
1. **"I want to think about this part of the material"** — pinned chats let you have location-bound conversations that come back when you return to the location.
2. **"I want to remember this for later"** — stars capture moments in one tap and aggregate into a revision view.

## 2. Goals and non-goals

### Goals
- A student can chat with each resource, with location-aware context (recent pages or transcript window).
- Chats can be pinned to specific pages / timestamps / slides; multiple chats per resource, organized as tabs.
- Multiple chats can be pinned to the same location.
- Session restore: closing and reopening a resource returns the user to their last-open tabs.
- One-tap starring from anywhere a student is consuming content.
- A unified revision view that surfaces all stars across a project, organized into manual lists.
- "Ask about this card" creates a fresh chat scoped to the starred item, without polluting the original resource chats.
- "Go to source" navigation from any card back to the exact source location.
- Multi-LLM support: user provides API keys for OpenAI, Anthropic, and/or Google; one of these is used for chat and summaries.

### Non-goals for v0
- Canvas / spatial workspace
- Cross-resource chat (chat that spans multiple PDFs at once)
- Planner agent / resource discovery from a syllabus
- Notes-with-AI-gap-detection
- Auto-clustering of stars by topic
- Local LLM support (Ollama, llama.cpp, etc.) — defer to v0.1+
- Embedding-based retrieval over full documents — defer to v0.1+ (architecture allows for it)
- Multi-user / collaboration
- Hosted SaaS / billing / public deployment
- Mobile apps
- Handwriting OCR
- Spaced repetition / flashcard scheduling
- Export of revision content
- Search across stars or chats

These are explicit later-stage items. Do not build them in v0.

## 3. Target user

Self: a BTech / university student preparing for semester exams, comfortable running a Docker Compose stack on their own laptop, supplying their own API key. The primary instance is a personal install used by the builder and shared with their ML club.

Design assumptions:
- Laptop primary, may use phone on local network occasionally
- English + Hinglish in chats
- Mix of clean and scanned PDF notes, YouTube lectures, uploaded lecture recordings
- Tech-comfortable enough to install via Docker but not interested in babysitting infrastructure

## 4. Core concepts

### Project
A top-level container scoped to a subject, exam, or unit (e.g., "Operating Systems," "DBMS Mid-Sem"). Created by the user. Contains resources, chats, stars, and lists.

### Resource
A study material inside a project. One of four types:
1. **PDF** — uploaded file
2. **PPT** — uploaded `.pptx` file
3. **YouTube** — pasted URL, captions fetched (no captions → fail gracefully with a clear message; uploaded-video transcription via Whisper is the path for non-captioned content)
4. **Video** — uploaded video file, auto-transcribed via local Whisper

Each resource holds one or more chats.

### Chat
A conversation about a resource. Lives in the resource's chat panel as a tab. Chats have two key properties:
- **Pinned vs unpinned**: a pinned chat is anchored to a specific location in the resource (page, slide, or timestamp). An unpinned chat has no anchor.
- **Open vs closed**: an open chat occupies a tab in the chat panel; a closed chat may or may not persist (see lifecycle below).

**Chat lifecycle rules:**
- An **unpinned + open** chat exists as a tab.
- An **unpinned + closed** chat is discarded immediately. No retention.
- A **pinned + open** chat exists as a tab.
- A **pinned + closed** chat persists and is retrievable from its anchor in the resource viewer.

### Card chat (special)
A separate kind of chat created when the user clicks "Ask about this" on a revision card. Scoped to the card's source content. Persists with the card. Not pinnable. Not in the resource's tab panel — lives inside the card.

### Star
A one-tap capture of something important. Becomes a card in the revision view. Star types:
- `pdf_page` — current page in the PDF viewer
- `pdf_selection` — highlighted text in a PDF
- `ppt_slide` — current slide in the PPT viewer
- `video_timestamp` — current playback position (single point)
- `chat_full` — an entire chat thread (pinned or unpinned)
- `chat_message_full` — one full AI message
- `chat_message_selection` — a highlighted span inside an AI message

### Card
The visual representation of a star in the revision view. Every star becomes exactly one card. Cards have an AI-generated summary (for non-selection stars) or use the selected text directly (for selection stars).

### List
A user-created grouping of cards within a project. Manual only in v0. Cards can be in zero, one, or many lists. Lists are flat (no nesting).

## 5. User flows

### Flow 1: Create project and add a resource
1. User opens app, sees home with project list.
2. Clicks "New project," enters name, lands in empty project view.
3. Clicks "Add resource" → picks PDF / PPT / YouTube / Video.
4. Uploads file or pastes URL.
5. Ingestion runs (text extraction for documents, transcription for videos). Status shown.
6. When ready, resource appears in the project's resource list.

### Flow 2: Chat with a resource (unpinned)
1. User opens a PDF resource. Viewer on one side, chat panel on the other.
2. Chat panel is empty (no tabs). Ribbon shows "+ New chat" button.
3. User clicks "+ New chat" → new unpinned chat tab opens.
4. User types a question. AI responds with citations like "(page 47)" that are clickable; clicking jumps the viewer to the cited page.
5. As the user scrolls through the PDF, the chat's "context window" follows the current page. The AI sees the current page ± 3 pages by default.
6. User closes the chat tab without pinning → chat is discarded.

### Flow 3: Pin a chat
1. With a chat open, user is on page 47 and finds the conversation valuable.
2. User clicks "Pin to page 47" in the ribbon below the tab strip.
3. Toast: "Chat pinned to page 47."
4. The ribbon button now reads "Pinned to page 47 ✓."
5. Tab label updates to show "📌 p.47" indicator.
6. User scrolls to page 80. The pinned chat tab stays open; user can keep chatting in it.
7. User closes the tab → chat persists because it's pinned.

### Flow 4: Return to a pinned chat
1. User reopens the resource later. Their last-open tabs are restored.
2. User scrolls to page 47. A "📌 1 pinned chat here" indicator appears in the viewer (or near the page).
3. User clicks the indicator → small selector lists pinned chats at this location (if more than one).
4. User picks the chat → it opens as a new tab (or, if already in tabs, brought to the front while preserving tab order).

### Flow 5: Move a pinned chat
1. User has a chat pinned to page 47, open as a tab.
2. User navigates to page 80.
3. User clicks ribbon button (currently "Pinned to page 47 ✓") → chat becomes unpinned. Toast: "Chat unpinned."
4. Ribbon button now reads "Pin to page 80."
5. User clicks again → chat is pinned to page 80. Toast: "Chat pinned to page 80."
6. The indicator on page 47 no longer shows this chat.

### Flow 6: Star something
1. User on page 47 clicks the star button in the PDF toolbar.
2. Popup appears with optional "Add to list" dropdown. Primary button "Star" is default-focused.
3. User hits Enter (or clicks Star) → popup dismisses, star saved.
4. AI summary generates async; card appears in revision view with "Generating summary…" placeholder.

### Flow 7: Review starred content
1. User opens the project's "Revision" tab.
2. Sees a flat feed of all cards in the project, sorted by most recent.
3. Filters: by resource, by star type, by list.
4. Group toggle: ungrouped (default) or grouped by resource.
5. Clicks a card → expanded view with content preview, "Ask about this," "Go to source."

### Flow 8: Ask about a card
1. From a card's expanded view, user clicks "Ask about this."
2. Card-scoped chat opens (separate from resource chats; not pinnable).
3. AI has context of the card's source content (e.g., the page text, slide text, transcript window around a timestamp, or the AI message text).
4. User can also click "Go to source" to navigate back to the original resource at the original location. The card's chat does not merge into the resource's chats; it stays with the card.

## 6. Functional requirements

### 6.1 Projects
- Create, rename, delete projects.
- List all projects on the home view.
- Project deletion cascades to resources, chats, stars, lists.

### 6.2 Resources
- Upload PDFs (`.pdf`), PPTs (`.pptx`).
- Paste YouTube URLs (validate, fetch captions). If no captions are available, show a clear error and recommend uploading the video file.
- Upload video files (`.mp4`, `.mov`, `.webm`); transcribe with local Whisper.
- Show ingestion status: queued, processing, ready, failed.
- Each resource has a viewer:
  - **PDF viewer**: page-aware, zoom, scroll. Use `pdf.js` (via `react-pdf`).
  - **PPT viewer**: slide-by-slide. Convert slides to images server-side via LibreOffice headless; keep extracted text per slide for chat context.
  - **YouTube viewer**: embedded YouTube iframe player; seek to timestamp via the iframe API.
  - **Video viewer**: HTML5 video player with standard JS seek control.
- Each resource has a chat panel beside the viewer with the structure defined in §6.4.

### 6.3 Ingestion pipeline (v0: text extraction only, no embeddings)
- **PDF**: `pymupdf` for text extraction, page by page. Store one text record per page with anchor `{page: N}`.
- **PPT**: `python-pptx` for text extraction, slide by slide. Convert slides to PNG via LibreOffice for the viewer. Store one text record per slide with anchor `{slide: N}` plus the rendered image path.
- **YouTube**: fetch transcript via `youtube-transcript-api`. Store transcript segments with their start/end timestamps. If no transcript is available, mark resource as `failed` with a clear reason.
- **Video upload**: transcribe with `faster-whisper` (whisper-small by default; configurable). Store transcript segments with timestamps.
- Transcripts (YouTube + video) are stored as a list of segments: `[{t_start, t_end, text}, ...]`.
- No embeddings, no vector store. (See Appendix E for the retrieval interface that allows adding embeddings in v0.1 without changing the chat code.)

### 6.4 Chats (the pinned-chat model)

**Chat panel layout** (right side of resource view, top to bottom):
1. **Tab strip** — one tab per open chat. Each tab shows:
   - Chat name (auto-generated from first user message; user can rename)
   - Pin indicator if pinned: `📌 p.47` (or `📌 12:34`, `📌 slide 3`)
   - Close (×) button on hover *if and only if* the chat is unpinned
   - Note: pinned chats cannot be closed via hover-× to prevent surprise loss. Instead, an explicit "Close tab" menu item is available via right-click or a tab-overflow menu; closing a pinned tab simply hides it from the panel (chat is retained because it's pinned).
2. **Ribbon** — below the tab strip, above the message area. Contains:
   - **Pin/unpin button** (state machine, see below)
   - **"+ New chat"** button
3. **Message area** — the active chat's messages, with streaming responses.
4. **Input box** — at the bottom; multiline, send on Cmd/Ctrl+Enter.

**Pin button state machine** (acts on the currently active tab's chat):
- If chat is unpinned: button reads "Pin to page N" (or timestamp/slide). Click → pins chat to current location, shows toast.
- If chat is pinned to location X: button reads "Pinned to page X ✓". Click → unpins chat, shows toast.
- After unpinning, if the user is now at location Y, button updates to "Pin to page Y" automatically.

**Anchor rules:**
- A chat has 0 or 1 anchors.
- Pinning replaces any existing anchor — but only if the user has explicitly unpinned first. Clicking the pin button on an already-pinned chat at a different location performs an unpin (not a re-pin). This is the intentional two-step behavior.
- Multiple chats can be pinned to the same anchor.

**Pinned chat indicator in the viewer:**
- At any page/timestamp/slide that has one or more pinned chats, an indicator is rendered in the viewer (small badge, e.g., `📌 2`).
- The indicator is shown regardless of whether those chats are currently open as tabs.
- Click the indicator → popover with a list of pinned chats at this location.
- Each item in the popover shows the chat name and last-message preview.
- Clicking an item:
  - If the chat is already open as a tab → bring that tab to the front. Do not reorder tabs.
  - If the chat is not open → open it as a new tab (appended to the right of the tab strip).

**Session persistence (resource open/close behavior):**
- The system tracks, per `(user, resource)`, the list of currently open tabs and their order.
- When the user closes the resource (navigates away), open tab state is saved.
- When the user reopens the resource, the same tabs are restored — *with the exception of unpinned chats that were closed during the previous session*, which are gone.
- An unpinned chat that was still open as a tab at the time of resource close is retained as a tab, but it's still "unpinned" and will be discarded if the user later closes its tab.

**Multiple chats per anchor:**
- A user can have any number of chats pinned to the same page/timestamp/slide.
- Popover selector handles disambiguation when opening.

**Chat naming:**
- Auto-generated from the first user message (first 40 chars, fall back to "New chat" if empty).
- User can rename via right-click on tab or via a chat-settings affordance.

### 6.5 Chat context (retrieval)

The chat's context window is determined by a **retrieval strategy** (Appendix E). The v0 strategy is `RecentWindowRetrieval`:

- **PDF**: current page text + previous 3 pages + next 3 pages. Configurable in settings (default ±3).
- **PPT**: current slide + previous 2 slides + next 2 slides. Configurable (default ±2).
- **YouTube / Video**: transcript segments within ±90 seconds of current playback position. Configurable.

"Current location" is defined as:
- For pinned chats: the chat's anchor.
- For unpinned chats: the user's current location in the viewer (page being viewed, playback position, current slide). Updates live as the user navigates, *with debouncing of 1 second to avoid context churn while scrolling*.

The chat backend calls `retriever.get_context(resource, anchor, query) -> ContextBundle`. In v0, the implementation ignores `query` and returns the windowed content based on `anchor`. Later versions may add embedding retrieval, hybrid retrieval, etc.

### 6.6 Chat behavior and LLM integration
- Each user message and AI response is persisted with the chat.
- Streaming responses (server-sent events or chunked HTTP from FastAPI to the React client).
- Each AI response includes citations in a structured format the frontend renders as clickable chips:
  - `[page 47]` for PDFs
  - `[slide 12]` for PPTs
  - `[12:34]` for videos
- The LLM is prompted to output JSON: `{answer: string, citations: [{type, anchor, quote}], suggested_followups: [string]}`. (See Appendix F for prompts.)
- The frontend renders `answer` with citation chips inline (parse the structured output, splice chips into the rendered markdown).
- Suggested follow-ups appear as buttons under the AI message — clicking sends the suggestion as the next user message.
- The system supports OpenAI, Anthropic, and Google as LLM providers. User configures the provider, model, and API key in settings. See Appendix D.
- Hinglish support: the LLM prompt explicitly states "User input may mix English and Hindi (Hinglish). Respond in the same language style the user used."

### 6.7 Starring

**Entry points:**
- PDF viewer toolbar: star current page.
- PDF text selection context menu: star selected text.
- PPT viewer toolbar: star current slide.
- Video player: star button captures current timestamp.
- Chat message hover-action: star full message.
- Chat message text selection context menu: star selection.
- Chat tab right-click menu: star entire chat.

**Star creation popup:**
- Appears immediately on any star action.
- Single field: "Add to list" dropdown (optional, with quick-create new list).
- "Star" button (primary, default-focused). Esc / click-outside dismisses but still saves the star without list.
- Popup dismisses within 200ms; do not block the user.

**Card AI summary generation:**
- For non-selection stars, generate a 1–2 sentence summary on creation. Async.
- Placeholder ("Generating summary…") in the card until the summary returns.
- Summary prompts per type (see Appendix F).
- If summary generation fails (e.g., API error), fall back to a deterministic generic summary like "Page 47 of OS Notes" so the card is still usable.

### 6.8 Revision view
- Per-project tab.
- Default view: flat list of cards, sorted by most recent first.
- Filters: by resource, by star type, by list. Filters are additive.
- Group toggle: ungrouped (default) or grouped by resource.
- Each card displays:
  - Star type icon + source label (e.g., "📄 OS Notes — page 47")
  - AI summary or selected text
  - Created timestamp
  - List badges
  - Action buttons: "Open" (expand), "Ask about this," "Go to source"
- Expanded card view:
  - Full content preview:
    - `pdf_page`: rendered page image
    - `pdf_selection`: page image with selection highlighted
    - `ppt_slide`: slide image
    - `video_timestamp`: embedded video player starting at the timestamp
    - `chat_full` / `chat_message_full` / `chat_message_selection`: rendered chat content
  - User note field (editable, optional)
  - Card-scoped chat (collapsed if empty; expanded if any messages exist)
  - "Ask about this" → opens/focuses the card's chat
  - "Go to source" → navigates to the source resource at the right anchor

### 6.9 Lists
- Create list with name (project-scoped).
- Rename, delete lists.
- Add/remove cards via the card itself or via multi-select in the revision view.
- A card can belong to multiple lists.
- Deleting a list does not delete its cards.

### 6.10 Card chat
- Created on first "Ask about this" click.
- Scoped to the card's source content (page text, slide text, transcript window ±60s around timestamp, or the AI message text).
- Persistent with the card. Not pinnable. Not in the resource's tab strip.
- "Go to source" button always visible — takes user back to the resource. The card's chat does not transfer; it stays with the card.

### 6.11 Cross-project rollup (home view)
- The home view (outside any project) shows a section titled "Recent stars across projects."
- Cards are grouped by project. Read-only — full filtering and actions live in each project's revision view.

### 6.12 Settings
- API key configuration per provider (OpenAI, Anthropic, Google).
- Provider selection (which to use for chat; which to use for summaries — can be the same or different).
- Model selection per provider (curated dropdown — see Appendix D).
- Context window size overrides (pages, slides, seconds).
- Whisper model size selection (tiny, small, medium — affects transcription speed vs accuracy).
- Reset/clear app data button (with confirmation).

## 7. Non-functional requirements

- **Performance**: Star action must feel instant. Popup appears in <100ms. Card creation completes (without AI summary) in <300ms. AI summary fills in async.
- **Self-hosted**: deployable via Docker Compose with one command (`docker compose up`). No external dependencies beyond the LLM API.
- **API key handling**: keys stored locally only (Postgres or env file). Never logged. Never sent anywhere except the configured LLM provider.
- **Persistence**: all state survives container restarts and page reloads.
- **Hinglish support**: chat must handle mixed English-Hindi input. LLM prompt explicitly states this.
- **Whisper transcription on CPU**: must show clear progress for long videos. Don't block the UI — let the user keep working in other resources while transcription runs in the background.
- **No analytics, no telemetry**: this is a personal tool. No data leaves the user's machine except LLM API calls.
- **Single-user**: v0 assumes one user per install. Auth can be a single password to gate the UI (env-configurable), or skipped entirely if user trusts their network.

## 8. Tech stack

**Frontend:**
- Next.js (App Router) + React + TypeScript
- Tailwind CSS for styling
- `react-pdf` for PDF rendering (built on `pdf.js`)
- HTML5 `<video>` for uploaded video
- YouTube iframe API for YouTube
- React Query or SWR for server state
- Zustand or similar for local UI state (tab order, current chat, etc.)

**Backend:**
- FastAPI (Python)
- SQLAlchemy + Alembic for DB
- Postgres (or SQLite for single-user simplicity — both should work; Postgres recommended for concurrent ingestion jobs)
- Background worker via FastAPI BackgroundTasks for v0 (simple). Move to RQ/Celery in v0.1 if needed.
- `pymupdf` for PDF text extraction
- `python-pptx` for PPT text
- LibreOffice headless for PPT → image conversion
- `youtube-transcript-api` for YouTube captions
- `faster-whisper` for local video transcription (CPU-friendly)

**LLM integration:**
- A `LLMClient` abstraction with three implementations: `OpenAIClient`, `AnthropicClient`, `GoogleClient`.
- All implement the same interface: `chat(messages, model, temperature, response_format) -> AsyncIterator[Chunk]`.
- Selected at runtime based on user settings.

**Storage:**
- All files on local disk under a configured volume (`/data` inside container, mapped to a host path).
- Directory structure: `/data/resources/{resource_id}/{original_filename}`, `/data/resources/{resource_id}/extracted/`, `/data/transcripts/{resource_id}.json`, etc.

**Deployment:**
- Docker Compose with services: `frontend`, `backend`, `db` (Postgres). Optional: `whisper-worker` if transcription is pulled into its own service for resource isolation.
- A single `.env` file holds the API keys and any optional auth password.

**Auth (v0):**
- Optional single-password gate on the frontend, enforced by the backend. Set via env var. Skip-able for trusted local use.

## 9. Data model

```sql
-- Settings (single-row table for self-hosted)
settings(
  id INT PRIMARY KEY DEFAULT 1,  -- always 1
  openai_api_key TEXT NULL,
  anthropic_api_key TEXT NULL,
  google_api_key TEXT NULL,
  chat_provider TEXT,  -- 'openai' | 'anthropic' | 'google'
  chat_model TEXT,
  summary_provider TEXT,
  summary_model TEXT,
  pdf_context_pages INT DEFAULT 3,
  ppt_context_slides INT DEFAULT 2,
  video_context_seconds INT DEFAULT 90,
  whisper_model TEXT DEFAULT 'small',
  updated_at TIMESTAMP
)

-- Projects
projects(id, name, created_at, updated_at)

-- Resources
resources(
  id, project_id, type,  -- 'pdf' | 'pptx' | 'youtube' | 'video'
  title, source_url_or_path,
  ingestion_status,  -- 'queued' | 'processing' | 'ready' | 'failed'
  ingestion_error TEXT NULL,
  metadata_json,  -- page_count, duration_seconds, slide_count, etc.
  created_at
)

-- Resource content (replaces "chunks" — no embeddings in v0)
resource_content(
  id, resource_id,
  anchor_json,  -- {page: 47} or {slide: 12} or {t_start: 754, t_end: 770}
  content_text,
  order_index  -- monotonic within resource for ordered traversal
)

-- Chats
chats(
  id, project_id, resource_id,
  name TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  anchor_json NULL,  -- only meaningful if is_pinned=true: {page: 47} etc.
  created_at, updated_at
)

-- Tab state (per resource, tracks open tabs and order across sessions)
resource_tab_state(
  resource_id PRIMARY KEY,
  open_chat_ids JSON,  -- ordered array of chat_ids currently open as tabs
  active_chat_id NULL,  -- which tab is currently in front
  updated_at
)

-- Card chats (separate type, scoped to a star)
card_chats(
  id, star_id,
  created_at
)

-- Messages (works for both resource chats and card chats)
messages(
  id,
  chat_id NULL,  -- one of chat_id or card_chat_id must be set
  card_chat_id NULL,
  role,  -- 'user' | 'assistant'
  content_text,
  citations_json,  -- structured citations
  suggested_followups_json,
  created_at
)

-- Stars
stars(
  id, project_id,
  type,  -- 'pdf_page' | 'pdf_selection' | 'ppt_slide' | 'video_timestamp' | 'chat_full' | 'chat_message_full' | 'chat_message_selection'
  anchor_json,  -- see Appendix B for shape per type
  selected_text NULL,  -- for *_selection types
  ai_summary NULL,
  user_note NULL,
  created_at
)

-- Lists
lists(id, project_id, name, created_at)

-- List membership
list_stars(list_id, star_id, added_at, PRIMARY KEY (list_id, star_id))
```

Note: "card" is purely a UI rendering of a star. A star may or may not have a card_chat attached.

## 10. Open questions

1. PPT rendering server-side via LibreOffice has a memory cost. Worth measuring on a typical laptop (8–16GB) with a 50-slide deck.
2. Whisper-small on CPU: a 1-hour video may take 15–30 minutes. Do we need a queue UI showing transcription progress, or is "🔄 transcribing" status enough? Probably enough for v0.
3. The card-chat data model is currently separate from chats. Could be unified with a `scope` field on `chats` table. Cleaner DB-wise but might confuse the chat panel logic. Leave separate for v0 unless it becomes painful.
4. Tab strip overflow: what happens with 8+ open tabs? Horizontal scroll? Overflow menu? Probably overflow menu (a chevron that opens a dropdown of tabs that don't fit). Defer the design to implementation time.

## 11. Success criteria for v0

- Builder uses it for one exam cycle and prefers it to ad-hoc ChatGPT-side-by-side.
- ML club members install it, use it for at least one assignment / exam, and have specific feature feedback (positive signal: feedback is detailed, meaning they actually used it).
- Median session: ≥ 1 chat pinned, ≥ 3 stars created, ≥ 1 return visit to the revision view.
- No data loss incidents.
- Citation chips land on the correct page/timestamp ≥ 90% of the time (target — measure during testing).

---

## Appendix A — AI summary prompts per star type

All prompts target ≤ 2 sentences and emphasize "why past-me cared," not a recap of the underlying material.

**pdf_page:**
> The user is studying "{resource_title}" and starred page {page}. Page content:
> ```
> {page_text}
> ```
> In one short sentence (max 25 words), describe the key concept or fact on this page that a student would have wanted to remember. Focus on the most likely reason to revisit, not a summary of everything.

**ppt_slide:**
> The user is studying "{resource_title}" and starred slide {slide} ("{slide_title}"). Slide content:
> ```
> {slide_text}
> ```
> In one short sentence (max 25 words), capture the core idea this slide conveys.

**video_timestamp:**
> The user is studying "{resource_title}" and starred timestamp {hh:mm:ss}. Transcript around this moment:
> ```
> {transcript_window}
> ```
> In one short sentence (max 25 words), describe what's being explained at this point that a student would have wanted to remember.

**chat_full:**
> The user starred this entire chat about "{resource_title}". Chat content:
> ```
> {chat_text}
> ```
> In one short sentence (max 25 words), capture the question being explored and the key insight reached.

**chat_message_full:**
> The user starred this AI message from a chat about "{resource_title}". Message:
> ```
> {message_text}
> ```
> In one short sentence (max 25 words), capture the core point of this message.

**Selection types** (`pdf_selection`, `chat_message_selection`):
No AI call. Card body = the selected text itself.

## Appendix B — Anchor JSON shapes

```json
// pdf_page
{ "page": 47 }

// pdf_selection
{ "page": 47, "bbox": [x0, y0, x1, y1] }

// ppt_slide
{ "slide": 12 }

// video_timestamp
{ "t_seconds": 754 }

// chat_full
{ "chat_id": "..." }

// chat_message_full
{ "chat_id": "...", "message_id": "..." }

// chat_message_selection
{ "chat_id": "...", "message_id": "...", "char_start": 142, "char_end": 287 }

// chat anchor (for pinned chats)
// One of:
{ "page": 47 }
{ "slide": 12 }
{ "t_seconds": 754 }
```

## Appendix C — UI primitives that must exist

- Project switcher / home (top nav)
- Project view with resources sidebar + main pane
- Resource viewer (type-specific component)
- **Chat panel** with:
  - **Tab strip** — chat tabs with pin indicator, close-on-hover for unpinned
  - **Ribbon** — pin/unpin button + "+ New chat" button
  - **Message area** — messages with citation chips, streaming, suggested follow-ups
  - **Input** — multiline, send on Cmd/Ctrl+Enter
- **Pinned chat indicator** in viewer (badge near the page/timestamp/slide)
- **Pinned chat popover** (selector when multiple chats are at the same anchor)
- Star button (type-specific entry points per §6.7)
- Star creation popup
- Revision view (per project tab)
- Card (compact + expanded forms)
- List management (sidebar or modal in revision view)
- Citation chip (clickable, renders inside AI messages)
- Settings panel (API keys, model selection, context windows, etc.)
- Toast / notification system (for "Chat pinned to page 47," etc.)

## Appendix D — LLM provider configuration

Three providers supported in v0. Each requires a user-supplied API key.

**OpenAI**
Default models exposed in settings: `gpt-5`, `gpt-5-mini`, `gpt-4.1`, `gpt-4.1-mini`. (Curated list — update as new models release.)
SDK: official `openai` Python package.
Base URL configurable for OpenAI-compatible endpoints (future-proofing for local model support in v0.1).

**Anthropic**
Default models exposed in settings: `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`.
SDK: official `anthropic` Python package.

**Google**
Default models exposed in settings: `gemini-2.5-pro`, `gemini-2.5-flash`.
SDK: `google-generativeai` Python package.

**Provider abstraction:**
```python
class LLMClient(Protocol):
    async def chat(
        self,
        messages: list[Message],
        model: str,
        temperature: float = 0.7,
        response_format: Literal["text", "json"] = "text",
        stream: bool = True,
    ) -> AsyncIterator[Chunk]: ...
```

Implementations: `OpenAIClient`, `AnthropicClient`, `GoogleClient`. A factory function picks the right one based on settings.

**Per-use-case configuration:**
- **Chat**: user-selected provider + model. Streaming required.
- **Summaries**: user-selected provider + model (often a smaller/cheaper model). Streaming not required.

Both can use the same provider+model, or different. Configurable independently in settings.

**Failure handling:**
- API errors surface as toast notifications and inline error states in the chat.
- API key missing or invalid → user is prompted to fix in settings.
- Rate limits → exponential backoff with user-visible status.

## Appendix E — Retrieval strategy interface

The chat backend never calls retrieval directly. It calls a `Retriever`:

```python
class Retriever(Protocol):
    async def get_context(
        self,
        resource: Resource,
        anchor: Anchor | None,  # pinned chats provide an anchor; unpinned use viewer location
        query: str,  # the user's message
    ) -> ContextBundle:
        ...

@dataclass
class ContextBundle:
    items: list[ContextItem]  # ordered, ready to be assembled into the LLM prompt
    metadata: dict  # debugging info: which strategy ran, what was selected, etc.

@dataclass
class ContextItem:
    anchor: Anchor  # for citation generation
    text: str
```

**v0 implementation: `RecentWindowRetrieval`**
- Ignores `query`.
- Returns ordered content items within a configured window around the anchor.
- For PDFs: pages `[anchor.page - N, anchor.page + N]`, default N=3.
- For PPTs: slides `[anchor.slide - N, anchor.slide + N]`, default N=2.
- For videos: transcript segments overlapping `[anchor.t - M, anchor.t + M]`, default M=90 seconds.

**Future v0.1+ implementations (NOT v0):**
- `EmbeddingRetrieval` — vector similarity search across the whole resource. Uses `query`.
- `HybridRetrieval` — combine recent-window with embedding results, dedupe.
- `AnchorBiasedEmbeddingRetrieval` — vector similarity weighted by distance from anchor.

The chat code does not change between these. Only the strategy registered with the chat backend changes.

## Appendix F — Chat system prompt

System prompt (concatenated with the context bundle and user message):

```
You are a study assistant helping a student understand the material they are reading or watching.

The student is studying "{resource_title}". Below is the content from the part of the resource they are currently engaged with. Use this content to ground your answers.

CONTENT:
---
{context_items_rendered_with_anchors}
---

Rules:
1. Answer the student's question using only the provided content when possible. If the content does not contain enough information, say so plainly — do not make things up.
2. Cite specific locations in your answer using the structured citation format.
3. The student may write in English, Hindi, or Hinglish (mixed English-Hindi). Respond in whichever style matches their input.
4. Be concise. Aim for a focused answer rather than a comprehensive lecture.
5. Suggest 2-3 useful follow-up questions the student could ask next.

Respond as a JSON object with this exact shape:
{
  "answer": "...your answer in markdown, with citation references like [page 47] or [12:34] inline...",
  "citations": [
    {"type": "pdf_page" | "ppt_slide" | "video_timestamp", "anchor": {...}, "quote": "exact text from the content that supports this citation"}
  ],
  "suggested_followups": ["...", "...", "..."]
}
```

Citation rendering on the frontend: parse the JSON, render `answer` as markdown, then post-process to replace `[page 47]` and `[12:34]` patterns with clickable React components that trigger navigation to the cited anchor.
