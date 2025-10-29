from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from ..db.connection import get_db
from ..db import models
from ..utils.image_generation import generate_fashion_frame


class BloggerCreate(BaseModel):
    name: str
    type: str  # "podcaster" or "fashion"
    image: Optional[str] = None
    tone_of_voice: Optional[str] = None
    theme: Optional[str] = None
    voice_id: Optional[str] = None
    content_schedule: Optional[dict] = None  # deprecated, keeping for backward compat
    content_types: Optional[dict] = None  # deprecated, keeping for backward compat
    locations: Optional[list] = None  # list of location objects with title, description, thumbnail
    outfits: Optional[list] = None  # list of outfit objects with name, image_url, parts
    editing_types_enabled: Optional[list] = None  # ["overlay", "rotoscope", "static"] - enabled options
    subtitles_enabled: Optional[int] = 0  # 1 or 0


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
    outfits: Optional[list]
    editing_types_enabled: Optional[list]
    subtitles_enabled: Optional[int]

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
    
    # Delete all related tasks first (cascade should handle this, but being explicit)
    db.query(models.ContentTask).filter(models.ContentTask.blogger_id == blogger_id).delete()
    
    # Delete blogger
    db.delete(blogger)
    db.commit()
    return {"ok": True}


# Locations management
class LocationAdd(BaseModel):
    title: str
    description: Optional[str] = None
    thumbnail: str


class LocationGenerate(BaseModel):
    prompt: str


@router.post("/{blogger_id}/locations", response_model=BloggerOut)
def add_location(blogger_id: int, payload: LocationAdd, db: Session = Depends(get_db)):
    """Add a location to blogger's locations list"""
    blogger = db.query(models.Blogger).get(blogger_id)
    if not blogger:
        raise HTTPException(status_code=404, detail="Blogger not found")
    
    locations = blogger.locations or []
    locations.append({
        "title": payload.title,
        "description": payload.description,
        "thumbnail": payload.thumbnail
    })
    
    blogger.locations = locations
    db.commit()
    db.refresh(blogger)
    return blogger


@router.delete("/{blogger_id}/locations/{location_index}", response_model=BloggerOut)
def delete_location(blogger_id: int, location_index: int, db: Session = Depends(get_db)):
    """Delete a location from blogger's locations list"""
    blogger = db.query(models.Blogger).get(blogger_id)
    if not blogger:
        raise HTTPException(status_code=404, detail="Blogger not found")
    
    locations = blogger.locations or []
    if location_index < 0 or location_index >= len(locations):
        raise HTTPException(status_code=404, detail="Location not found")
    
    locations.pop(location_index)
    blogger.locations = locations
    db.commit()
    db.refresh(blogger)
    return blogger


@router.post("/{blogger_id}/locations/generate")
def generate_location(blogger_id: int, payload: LocationGenerate, db: Session = Depends(get_db)):
    """Generate a location image using SDXL 4.0"""
    blogger = db.query(models.Blogger).get(blogger_id)
    if not blogger:
        raise HTTPException(status_code=404, detail="Blogger not found")
    
    try:
        # Generate using SDXL via FAL.ai (16:9 for landscape location)
        image_url = generate_fashion_frame(payload.prompt, "16:9")
        
        return {
            "image_url": image_url,
            "prompt": payload.prompt
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


# Outfits management
class OutfitAdd(BaseModel):
    name: str
    image_url: str
    parts: Optional[Dict[str, str]] = None


class OutfitGenerate(BaseModel):
    name: str
    parts: Dict[str, str]  # {top: url, bottom: url, shoes: url, accessories: url}


@router.post("/{blogger_id}/outfits", response_model=BloggerOut)
def add_outfit(blogger_id: int, payload: OutfitAdd, db: Session = Depends(get_db)):
    """Add an outfit to blogger's outfits list"""
    blogger = db.query(models.Blogger).get(blogger_id)
    if not blogger:
        raise HTTPException(status_code=404, detail="Blogger not found")
    
    outfits = blogger.outfits or []
    outfits.append({
        "name": payload.name,
        "image_url": payload.image_url,
        "parts": payload.parts or {}
    })
    
    blogger.outfits = outfits
    db.commit()
    db.refresh(blogger)
    return blogger


@router.delete("/{blogger_id}/outfits/{outfit_index}", response_model=BloggerOut)
def delete_outfit(blogger_id: int, outfit_index: int, db: Session = Depends(get_db)):
    """Delete an outfit from blogger's outfits list"""
    blogger = db.query(models.Blogger).get(blogger_id)
    if not blogger:
        raise HTTPException(status_code=404, detail="Blogger not found")
    
    outfits = blogger.outfits or []
    if outfit_index < 0 or outfit_index >= len(outfits):
        raise HTTPException(status_code=404, detail="Outfit not found")
    
    outfits.pop(outfit_index)
    blogger.outfits = outfits
    db.commit()
    db.refresh(blogger)
    return blogger


@router.post("/{blogger_id}/outfits/generate")
def generate_outfit(blogger_id: int, payload: OutfitGenerate, db: Session = Depends(get_db)):
    """Generate a full outfit image using Seedream v4 from parts"""
    blogger = db.query(models.Blogger).get(blogger_id)
    if not blogger:
        raise HTTPException(status_code=404, detail="Blogger not found")
    
    try:
        # Build prompt based on parts provided
        parts_description = []
        reference_image = None
        
        for part_name, part_url in payload.parts.items():
            if part_url:
                parts_description.append(f"{part_name} clothing")
                # Use first part as reference image for Seedream edit mode
                if not reference_image and part_url.startswith("http"):
                    reference_image = part_url
        
        # Generate composite outfit (3:4 portrait for full body outfit)
        prompt = f"Full body fashion photography of model wearing {payload.name} outfit: {', '.join(parts_description)}. Studio lighting, white background, full height portrait, professional fashion shoot, high quality"
        
        # Use Seedream v4 edit if we have reference image, otherwise text-to-image
        image_url = generate_fashion_frame(prompt, "3:4", reference_image=reference_image)
        
        return {
            "image_url": image_url,
            "prompt": prompt
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
