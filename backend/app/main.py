from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api import chats as chats_api
from app.api import projects as projects_api
from app.api import resources as resources_api
from app.api import settings as settings_api
from app.db.base import engine

app = FastAPI(title="Noted", version="0.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    db_ok = False
    try:
        with engine.connect() as c:
            c.execute(text("SELECT 1"))
            db_ok = True
    except Exception:
        db_ok = False
    return {"status": "ok", "db": db_ok}


app.include_router(projects_api.router)
app.include_router(resources_api.router)
app.include_router(chats_api.router)
app.include_router(settings_api.router)
