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
def list_tasks(blogger_id: Optional[int] = None, date: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.ContentTask)
    if blogger_id:
        q = q.filter(models.ContentTask.blogger_id == blogger_id)
    if date:
        q = q.filter(models.ContentTask.date == date)
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


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.ContentTask).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"ok": True}


# Fashion Post Generation Endpoints

class FashionSetupUpdate(BaseModel):
    location_id: Optional[int] = None
    location_description: Optional[str] = None
    outfit: Optional[dict] = None


@router.patch("/{task_id}/fashion/setup", response_model=TaskOut)
def update_fashion_setup(task_id: int, payload: FashionSetupUpdate, db: Session = Depends(get_db)):
    """Save location and outfit setup for fashion post"""
    task = db.query(models.ContentTask).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if payload.location_id is not None:
        task.location_id = payload.location_id
    if payload.location_description is not None:
        task.location_description = payload.location_description
    if payload.outfit is not None:
        task.outfit = payload.outfit
    
    db.commit()
    db.refresh(task)
    return task


class MainFrameRequest(BaseModel):
    prompt: Optional[str] = None
    custom_instructions: Optional[str] = None


@router.post("/{task_id}/fashion/generate-main-frame")
def generate_main_frame(task_id: int, payload: MainFrameRequest, db: Session = Depends(get_db)):
    """Generate the main full-height fashion frame with SDXL"""
    from ..utils.image_generation import generate_fashion_frame
    
    task = db.query(models.ContentTask).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    blogger = db.query(models.Blogger).get(task.blogger_id)
    if not blogger:
        raise HTTPException(status_code=404, detail="Blogger not found")
    
    # Build context for prompt generation
    location = None
    if task.location_id is not None and blogger.locations:
        location = blogger.locations[task.location_id] if task.location_id < len(blogger.locations) else None
    elif task.location_description:
        location = {"description": task.location_description}
    
    # Generate or use provided prompt
    if not payload.prompt:
        prompt = generate_text(f"""Create a detailed SDXL prompt for a fashion blogger main frame image.
        
Context:
- Blogger: {blogger.name} ({blogger.theme})
- Location: {location}
- Outfit: {task.outfit}
- Custom instructions: {payload.custom_instructions or 'N/A'}

Generate a single detailed prompt for SDXL 4.0 that creates a full-height fashion photo.
Include: pose, angle, lighting, mood. Keep under 200 tokens.
Only return the prompt text, nothing else.""")
    else:
        # Use provided or edited prompt
        prompt = payload.prompt
        if payload.custom_instructions:
            prompt = generate_text(f"""Update this SDXL prompt based on custom instructions:
            
Original prompt: {prompt}
Custom instructions: {payload.custom_instructions}

Return the updated prompt only.""")
    
    # Extract reference image from outfit if available
    reference_image = None
    if task.outfit:
        # Check if outfit has any URL parts
        for part_key in ["top", "bottom", "shoes", "accessories"]:
            part_data = task.outfit.get(part_key, {})
            if isinstance(part_data, dict) and part_data.get("type") == "url":
                part_value = part_data.get("value", "")
                if part_value and part_value.startswith("http"):
                    reference_image = part_value
                    break
    
    # Generate image with Seedream v4 (edit mode if reference_image, text-to-image otherwise)
    image_url = generate_fashion_frame(prompt, aspect_ratio="9:16", reference_image=reference_image)
    
    # Store in generated_images history
    if not task.generated_images:
        task.generated_images = {}
    if "main" not in task.generated_images:
        task.generated_images["main"] = []
    task.generated_images["main"].append(image_url)
    
    # Store prompt
    if not task.prompts:
        task.prompts = {}
    task.prompts["main"] = prompt
    
    db.commit()
    
    return {
        "image_url": image_url,
        "prompt": prompt,
        "task_id": task.id
    }


class ApproveFrameRequest(BaseModel):
    frame_type: str  # "main", "angle1", "angle2", "angle3"


@router.post("/{task_id}/fashion/approve-frame")
def approve_frame(task_id: int, payload: ApproveFrameRequest, db: Session = Depends(get_db)):
    """Approve a generated frame"""
    task = db.query(models.ContentTask).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # For main frame, save to main_image_url
    if payload.frame_type == "main":
        if task.generated_images and "main" in task.generated_images and task.generated_images["main"]:
            task.main_image_url = task.generated_images["main"][-1]  # Latest generated
            task.status = "MAIN_FRAME_APPROVED"
    
    db.commit()
    return {"ok": True, "approved": payload.frame_type}


class AdditionalFramesRequest(BaseModel):
    base_prompt: Optional[str] = None


@router.post("/{task_id}/fashion/generate-additional-frames")
def generate_additional_frames(task_id: int, payload: AdditionalFramesRequest, db: Session = Depends(get_db)):
    """Generate 3 additional angle variations based on approved main frame"""
    from ..utils.image_generation import generate_fashion_frame
    
    task = db.query(models.ContentTask).get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if not task.main_image_url:
        raise HTTPException(status_code=400, detail="Main frame must be approved first")
    
    base_prompt = payload.base_prompt or task.prompts.get("main") if task.prompts else ""
    
    # Use main frame as reference image for Seedream v4 edit mode
    reference_image = task.main_image_url
    
    # Define 3 angles
    angles = [
        "close-up shot focusing on upper body and face, same outfit and location",
        "medium shot from waist up, slightly angled to the side",
        "detail shot focusing on outfit accessories and styling details"
    ]
    
    results = []
    for i, angle_desc in enumerate(angles, 1):
        angle_key = f"angle{i}"
        
        # Generate prompt with angle variation
        prompt = generate_text(f"""Create an SDXL prompt variation for angle {i}.

Base prompt: {base_prompt}
Angle description: {angle_desc}

Keep same style, lighting, location. Only change: {angle_desc}
Return updated prompt only.""")
        
        # Generate image using main frame as reference (Seedream v4 edit mode)
        image_url = generate_fashion_frame(prompt, aspect_ratio="4:5", reference_image=reference_image)
        
        # Store
        if angle_key not in task.generated_images:
            task.generated_images[angle_key] = []
        task.generated_images[angle_key].append(image_url)
        
        if not task.prompts:
            task.prompts = {}
        task.prompts[angle_key] = prompt
        
        results.append({
            "angle": angle_key,
            "image_url": image_url,
            "prompt": prompt
        })
    
    db.commit()
    
    return {
        "frames": results,
        "task_id": task.id
    }
