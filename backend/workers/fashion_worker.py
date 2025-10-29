"""
Fashion post generation worker - generates main frame + 3 angle variations
"""
from sqlalchemy.orm import Session
from ..db.connection import engine
from ..db import models
from ..utils.image_generation import generate_fashion_frame
from ..utils.openai_chat import generate_text


def process_fashion_post(task_id: int):
    """
    Generate complete fashion post: 1 main frame (9:16) + 3 angle frames (4:5)
    
    Workflow:
    1. Generate main frame based on location + outfit
    2. Generate 3 angle variations using main frame as reference
    3. Update task status to REVIEW
    """
    with Session(engine) as s:
        task = s.query(models.ContentTask).get(task_id)
        if not task:
            return False
        
        try:
            task.status = "GENERATING"
            s.commit()
            
            blogger = s.query(models.Blogger).get(task.blogger_id)
            if not blogger:
                raise Exception("Blogger not found")
            
            # Build context for main frame
            location = None
            if task.location_id is not None and blogger.locations:
                location = blogger.locations[task.location_id] if task.location_id < len(blogger.locations) else None
            elif task.location_description:
                location = {"description": task.location_description}
            
            # Extract reference image from outfit if available
            reference_image = None
            if task.outfit:
                for part_key in ["top", "bottom", "shoes", "accessories"]:
                    part_data = task.outfit.get(part_key, {})
                    if isinstance(part_data, dict) and part_data.get("type") == "url":
                        part_value = part_data.get("value", "")
                        if part_value and part_value.startswith("http"):
                            reference_image = part_value
                            break
            
            # Generate main frame prompt
            main_prompt = generate_text(f"""Create a detailed SDXL prompt for a fashion blogger main frame image.

Context:
- Blogger: {blogger.name} ({blogger.theme})
- Location: {location}
- Outfit: {task.outfit}
- Style: Full-height fashion photography, professional quality

Generate a single detailed prompt for SDXL 4.0 that creates a full-height fashion photo.
Include: pose, angle, lighting, mood. Keep under 200 tokens.
Only return the prompt text, nothing else.""")
            
            print(f"[Fashion Worker] Generating main frame for task #{task_id}")
            print(f"[Fashion Worker] Prompt: {main_prompt[:100]}...")
            
            # Generate main frame (9:16 portrait)
            main_image_url = generate_fashion_frame(main_prompt, "9:16", reference_image=reference_image)
            
            # Store main frame
            if not task.generated_images:
                task.generated_images = {}
            task.generated_images["main"] = [main_image_url]
            task.main_image_url = main_image_url
            
            if not task.prompts:
                task.prompts = {}
            task.prompts["main"] = main_prompt
            
            s.commit()
            print(f"[Fashion Worker] Main frame generated: {main_image_url[:80]}...")
            
            # Generate 3 angle variations using main frame as reference
            angles = [
                "close-up shot focusing on upper body and face, same outfit and location",
                "medium shot from waist up, slightly angled to the side",
                "detail shot focusing on outfit accessories and styling details"
            ]
            
            for i, angle_desc in enumerate(angles, 1):
                angle_key = f"angle{i}"
                
                print(f"[Fashion Worker] Generating {angle_key}...")
                
                # Generate prompt variation
                angle_prompt = generate_text(f"""Create an SDXL prompt variation for angle {i}.

Base prompt: {main_prompt}
Angle description: {angle_desc}

Keep same style, lighting, location. Only change: {angle_desc}
Return updated prompt only.""")
                
                # Generate image using main frame as reference (Seedream edit mode)
                angle_image_url = generate_fashion_frame(angle_prompt, "4:5", reference_image=main_image_url)
                
                # Store angle frame
                if angle_key not in task.generated_images:
                    task.generated_images[angle_key] = []
                task.generated_images[angle_key].append(angle_image_url)
                task.prompts[angle_key] = angle_prompt
                
                s.commit()
                print(f"[Fashion Worker] {angle_key} generated: {angle_image_url[:80]}...")
            
            # Mark as ready for review
            task.status = "REVIEW"
            s.commit()
            
            print(f"[Fashion Worker] Task #{task_id} complete - 4 frames generated")
            return True
            
        except Exception as e:
            print(f"[Fashion Worker] Error processing task #{task_id}: {e}")
            task.status = "DRAFT"  # Reset to draft on error
            if not task.prompts:
                task.prompts = {}
            task.prompts["error"] = str(e)
            s.commit()
            return False
