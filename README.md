# Noted

Self-hosted study workspace. See `PRD.md` for the spec and `/home/abhay/.claude/plans/okay-can-you-use-optimized-meadow.md` for the staged build plan.

## Run (Stage 0)

```
cp .env.example .env   # add GEMINI_API_KEY when ready (Stage 2)
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend health: http://localhost:8000/api/health

## Layout

- `frontend/` — Vite + React + TypeScript. Design tokens (white + navy palette, dotted bg by default) in `src/styles/index.css`.
- `backend/` — FastAPI + SQLAlchemy + Alembic.
- `data/` — bind-mounted resource storage (PDFs etc., from Stage 1).
