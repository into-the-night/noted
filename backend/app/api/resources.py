from __future__ import annotations

from pathlib import Path
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Response, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.db.base import get_db
from app.db.models import Project, Resource
from app.schemas import ResourceOut
from app.services.pdf_ingest import ingest_pdf

router = APIRouter(tags=["resources"])


def _to_out(r: Resource) -> ResourceOut:
    return ResourceOut(
        id=r.id,
        project_id=r.project_id,
        type=r.type,
        title=r.title,
        ingestion_status=r.ingestion_status,
        ingestion_error=r.ingestion_error,
        metadata=r.resource_metadata or {},
        created_at=r.created_at,
    )


@router.get("/api/projects/{project_id}/resources", response_model=list[ResourceOut])
def list_resources(project_id: str, db: Session = Depends(get_db)) -> list[ResourceOut]:
    if not db.get(Project, project_id):
        raise HTTPException(404, "project not found")
    rows = db.execute(
        select(Resource).where(Resource.project_id == project_id).order_by(Resource.created_at.desc())
    ).scalars().all()
    return [_to_out(r) for r in rows]


@router.post("/api/projects/{project_id}/resources", response_model=ResourceOut, status_code=201)
async def upload_resource(
    project_id: str,
    background: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    db: Session = Depends(get_db),
) -> ResourceOut:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "project not found")

    filename = file.filename or "upload"
    suffix = Path(filename).suffix.lower()
    if suffix != ".pdf":
        raise HTTPException(400, f"only .pdf supported in stage 1 (got {suffix or 'no extension'})")

    resource = Resource(
        project_id=project_id,
        type="pdf",
        title=(title or Path(filename).stem)[:300],
        ingestion_status="queued",
        resource_metadata={},
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)

    target_dir = Path(settings.data_dir) / "resources" / resource.id
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / filename
    with target.open("wb") as f:
        while chunk := await file.read(1024 * 1024):
            f.write(chunk)

    resource.source_path = str(target)
    db.commit()

    background.add_task(ingest_pdf, resource.id)
    db.refresh(resource)
    return _to_out(resource)


@router.get("/api/resources/{resource_id}", response_model=ResourceOut)
def get_resource(resource_id: str, db: Session = Depends(get_db)) -> ResourceOut:
    r = db.get(Resource, resource_id)
    if not r:
        raise HTTPException(404, "resource not found")
    return _to_out(r)


@router.delete("/api/resources/{resource_id}", status_code=204, response_class=Response)
def delete_resource(resource_id: str, db: Session = Depends(get_db)) -> Response:
    r = db.get(Resource, resource_id)
    if not r:
        raise HTTPException(404, "resource not found")
    # Best-effort: remove on-disk file(s)
    if r.source_path:
        p = Path(r.source_path)
        try:
            if p.exists():
                p.unlink()
            if p.parent.exists() and not any(p.parent.iterdir()):
                p.parent.rmdir()
        except OSError:
            pass
    db.delete(r)
    db.commit()
    return Response(status_code=204)


@router.get("/api/resources/{resource_id}/file")
def get_resource_file(resource_id: str, db: Session = Depends(get_db)) -> FileResponse:
    r = db.get(Resource, resource_id)
    if not r or not r.source_path:
        raise HTTPException(404, "file not found")
    path = Path(r.source_path)
    if not path.exists():
        raise HTTPException(404, "file missing on disk")
    return FileResponse(
        path,
        media_type="application/pdf",
        filename=path.name,
        headers={"Cache-Control": "private, max-age=3600"},
    )
