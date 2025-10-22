from fastclass BloggerCreate(BaseModel):
    name: str
    type: str  # "podcaster" or "fashion"
    image: Optional[str] = None
    tone_of_voice: Optional[str] = None
    theme: Optional[str] = None
    voice_id: Optional[str] = None
    content_schedule: Optional[dict] = None  # deprecated, keeping for backward compat
    content_types: Optional[dict] = None  # deprecated, keeping for backward compat
    locations: Optional[list] = None  # list of location image URLs
    editing_types_enabled: Optional[list] = None  # ["overlay", "rotoscope", "static"] - enabled options
    subtitles_enabled: Optional[int] = 0  # 1 or 0
    content_frequency: Optional[dict] = None  # {"reels": 3, "post": 2, ...}IRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session

from ..db.connection import get_db
from ..db import models


class BloggerCreate(BaseModel):
    name: str
    type: str  # "podcaster" or "fashion"
    image: Optional[str] = None
    tone_of_voice: Optional[str] = None
    theme: Optional[str] = None
    voice_id: Optional[str] = None
    content_schedule: Optional[dict] = None  # deprecated, keeping for backward compat
    content_types: Optional[dict] = None  # deprecated, keeping for backward compat
    locations: Optional[list] = None  # list of location image URLs
    editing_type: Optional[str] = None  # "overlay", "rotoscope", "static"
    subtitles_enabled: Optional[int] = 0  # 1 or 0
    content_frequency: Optional[dict] = None  # {"reels": 3, "post": 2, ...}


class BloggerOut(BaseModel):
    id: int
    name: str
    type: str
    image: Optional[str]
    tone_of_voice: Optional[str]
    theme: Optional[str]
    voice_id: Optional[str]
    content_schedule: Optional[dict]
    content_types: Optional[dict]
    locations: Optional[list]
    editing_types_enabled: Optional[list]
    subtitles_enabled: Optional[int]
    content_frequency: Optional[dict]

    class Config:
        from_attributes = True


router = APIRouter()


@router.get("/", response_model=List[BloggerOut])
def list_bloggers(db: Session = Depends(get_db)):
    return db.query(models.Blogger).all()


@router.post("/", response_model=BloggerOut)
def create_blogger(payload: BloggerCreate, db: Session = Depends(get_db)):
    blogger = models.Blogger(**payload.model_dump())
    db.add(blogger)
    db.commit()
    db.refresh(blogger)
    return blogger


@router.get("/{blogger_id}", response_model=BloggerOut)
def get_blogger(blogger_id: int, db: Session = Depends(get_db)):
    blogger = db.query(models.Blogger).get(blogger_id)
    if not blogger:
        raise HTTPException(status_code=404, detail="Blogger not found")
    return blogger


@router.put("/{blogger_id}", response_model=BloggerOut)
def update_blogger(blogger_id: int, payload: BloggerCreate, db: Session = Depends(get_db)):
    blogger = db.query(models.Blogger).get(blogger_id)
    if not blogger:
        raise HTTPException(status_code=404, detail="Blogger not found")
    for k, v in payload.model_dump().items():
        setattr(blogger, k, v)
    db.commit()
    db.refresh(blogger)
    return blogger


@router.delete("/{blogger_id}")
def delete_blogger(blogger_id: int, db: Session = Depends(get_db)):
    blogger = db.query(models.Blogger).get(blogger_id)
    if not blogger:
        raise HTTPException(status_code=404, detail="Blogger not found")
    db.delete(blogger)
    db.commit()
    return {"ok": True}
