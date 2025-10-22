import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ..utils.openai_chat import generate_text
from sqlalchemy.orm import Session
from ..db.connection import get_db
from ..db import models


class AssistantRequest(BaseModel):
    message: str
    task_id: int | None = None


router = APIRouter()


@router.post("/")
def assistant(req: AssistantRequest):
    reply = generate_text(req.message)
    return {"reply": reply}


class MetaGenerateRequest(BaseModel):
    task_id: int


@router.post("/meta/generate")
def generate_meta(req: MetaGenerateRequest, db: Session = Depends(get_db)):
    task = db.query(models.ContentTask).get(req.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    blogger = task.blogger
    prompt = (
        f"Для контента '{task.idea or ''}' под тип '{task.content_type}', "
        f"с учётом тона '{blogger.tone_of_voice or ''}' и темы '{blogger.theme or ''}', предложи: "
        "стиль съёмки, одежду, локацию и погоду. Верни краткий JSON со свойствами style, outfit, location, weather."
    )
    text = generate_text(prompt)
    meta = models.TaskMeta(task_id=task.id, data={"suggestion": text})
    db.add(meta)
    db.commit()
    return {"ok": True, "task_id": task.id}


class SaveVersionRequest(BaseModel):
    task_id: int
    content: str
    kind: str = "script"


@router.post("/versions")
def save_version(req: SaveVersionRequest, db: Session = Depends(get_db)):
    v = models.TaskVersion(task_id=req.task_id, kind=req.kind, content=req.content)
    db.add(v)
    db.commit()
    return {"ok": True, "id": v.id}


@router.get("/versions/{task_id}")
def list_versions(task_id: int, db: Session = Depends(get_db)):
    return db.query(models.TaskVersion).filter(models.TaskVersion.task_id == task_id).order_by(models.TaskVersion.id.desc()).all()


@router.get("/meta/{task_id}")
def get_meta(task_id: int, db: Session = Depends(get_db)):
    meta = db.query(models.TaskMeta).filter(models.TaskMeta.task_id == task_id).order_by(models.TaskMeta.id.desc()).first()
    if not meta:
        return {"task_id": task_id, "data": None}
    return {"task_id": task_id, "data": meta.data}
