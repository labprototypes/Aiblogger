from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session

from ..db.connection import get_db
from ..db import models
from ..utils.queue import enqueue
from ..workers.image_worker import process_image
from ..workers.video_worker import process_video
from ..workers.voice_worker import process_voice
from ..workers import content_plan_worker
from ..utils.openai_chat import generate_text


class TaskCreate(BaseModel):
    blogger_id: int
    date: str  # ISO date string
    content_type: str
    idea: Optional[str] = None
    status: Optional[str] = "DRAFT"


class TaskOut(BaseModel):
    id: int
    blogger_id: int
    date: str
    content_type: str
    idea: Optional[str]
    status: str
    script: Optional[str]
    preview_url: Optional[str]

    class Config:
        from_attributes = True


class TaskStatusUpdate(BaseModel):
    status: str


router = APIRouter()


@router.get("/", response_model=List[TaskOut])
def list_tasks(blogger_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(models.ContentTask)
    if blogger_id:
        q = q.filter(models.ContentTask.blogger_id == blogger_id)
    return q.order_by(models.ContentTask.date.asc()).all()


@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.ContentTask).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/", response_model=TaskOut)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    task = models.ContentTask(**payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}", response_model=TaskOut)
def update_task_status(task_id: int, payload: TaskStatusUpdate, db: Session = Depends(get_db)):
    task = db.query(models.ContentTask).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = payload.status
    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/generate")
def trigger_generation(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.ContentTask).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    # Pick worker based on content_type
    ct = (task.content_type or "").lower()
    if any(k in ct for k in ["video", "reel", "short"]):
        job_id = enqueue(process_video, task.id)
    elif any(k in ct for k in ["voice", "podcast", "audio"]):
        job_id = enqueue(process_voice, task.id, text=task.script or task.idea or "", voice_id=task.blogger.voice_id if hasattr(task.blogger, "voice_id") else None)
    else:
        job_id = enqueue(process_image, task.id)
    task.status = "SCRIPT_READY"  # enqueued for visual generation
    db.commit()
    return {"queued": True, "task_id": task.id, "job_id": job_id}


@router.post("/{task_id}/script")
def generate_script(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.ContentTask).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    prompt = task.idea or f"Create a short content script for {task.content_type} on {task.date}"
    script = generate_text(prompt)
    task.script = script
    task.status = "SCRIPT_READY"
    db.commit()
    db.refresh(task)
    return {"ok": True, "task_id": task.id, "status": task.status}


class TaskContentUpdate(BaseModel):
    idea: Optional[str] = None
    script: Optional[str] = None


@router.put("/{task_id}/content", response_model=TaskOut)
def update_task_content(task_id: int, payload: TaskContentUpdate, db: Session = Depends(get_db)):
    task = db.query(models.ContentTask).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if payload.idea is not None:
        task.idea = payload.idea
    if payload.script is not None:
        task.script = payload.script
        if task.status in (None, "DRAFT", "PLANNED"):
            task.status = "SCRIPT_READY"
    db.commit()
    db.refresh(task)
    return task


class AutoPlanRequest(BaseModel):
    blogger_id: int
    year: int
    month: int  # 0-based (JS style) or 1-based? We'll accept 1-12 and normalize
    content_type: Optional[str] = "video"


@router.post("/plan/auto")
def auto_plan(req: AutoPlanRequest):
    # Build all days for given month
    m = req.month - 1 if req.month >= 1 else req.month
    from datetime import date, timedelta

    first = date(req.year, m + 1, 1)
    if m == 11:
        next_first = date(req.year + 1, 1, 1)
    else:
        next_first = date(req.year, m + 2, 1)
    days: list[str] = []
    d = first
    while d < next_first:
        days.append(d.isoformat())
        d += timedelta(days=1)
    job_id = enqueue(content_plan_worker.generate_plan, req.blogger_id, days, req.content_type or "video")
    return {"queued": True, "job_id": job_id, "days": len(days)}


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.ContentTask).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"ok": True}
