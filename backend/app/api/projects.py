from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.models import Project, Resource
from app.schemas import ProjectCreate, ProjectOut, ProjectUpdate

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _to_out(p: Project, count: int) -> ProjectOut:
    return ProjectOut(
        id=p.id,
        name=p.name,
        created_at=p.created_at,
        updated_at=p.updated_at,
        resource_count=count,
    )


@router.get("", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db)) -> list[ProjectOut]:
    rows = db.execute(
        select(Project, func.count(Resource.id))
        .outerjoin(Resource, Resource.project_id == Project.id)
        .group_by(Project.id)
        .order_by(Project.updated_at.desc())
    ).all()
    return [_to_out(p, c) for (p, c) in rows]


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)) -> ProjectOut:
    p = Project(name=payload.name.strip())
    db.add(p)
    db.commit()
    db.refresh(p)
    return _to_out(p, 0)


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: str, db: Session = Depends(get_db)) -> ProjectOut:
    p = db.get(Project, project_id)
    if not p:
        raise HTTPException(404, "project not found")
    count = db.scalar(select(func.count(Resource.id)).where(Resource.project_id == p.id)) or 0
    return _to_out(p, count)


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(project_id: str, payload: ProjectUpdate, db: Session = Depends(get_db)) -> ProjectOut:
    p = db.get(Project, project_id)
    if not p:
        raise HTTPException(404, "project not found")
    p.name = payload.name.strip()
    db.commit()
    db.refresh(p)
    count = db.scalar(select(func.count(Resource.id)).where(Resource.project_id == p.id)) or 0
    return _to_out(p, count)


@router.delete("/{project_id}", status_code=204, response_class=Response)
def delete_project(project_id: str, db: Session = Depends(get_db)) -> Response:
    p = db.get(Project, project_id)
    if not p:
        raise HTTPException(404, "project not found")
    db.delete(p)
    db.commit()
    return Response(status_code=204)
