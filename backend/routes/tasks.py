from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session

from ..db.connection import get_db
from ..db import models
from ..utils.queue import enqueue
from ..workers.image_worker import process_image


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
    job_id = enqueue(process_image, task.id)
    task.status = "SCRIPT_READY"  # enqueued for visual generation
    db.commit()
    return {"queued": True, "task_id": task.id, "job_id": job_id}


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.ContentTask).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"ok": True}
