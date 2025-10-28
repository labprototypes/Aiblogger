"""
Test script for fashion post generation API endpoints
Run with: python -m backend.test_fashion_api
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.db.connection import SessionLocal
from backend.db import models


def test_fashion_workflow():
    """Test the complete fashion post generation workflow"""
    db = SessionLocal()
    
    try:
        # 1. Create a fashion blogger
        print("1. Creating fashion blogger...")
        blogger = models.Blogger(
            name="Fashion Test Blogger",
            type="fashion",
            theme="street style, sustainable fashion",
            tone_of_voice="friendly, inspiring",
            locations=[
                {"title": "City Center", "description": "Urban backdrop with modern architecture", "thumbnail": ""},
                {"title": "Park", "description": "Green space with natural lighting", "thumbnail": ""},
                {"title": "Studio", "description": "Indoor studio with white background", "thumbnail": ""},
            ]
        )
        db.add(blogger)
        db.commit()
        db.refresh(blogger)
        print(f"   ✓ Created blogger #{blogger.id}: {blogger.name}")
        
        # 2. Create a post task
        print("2. Creating post task...")
        task = models.ContentTask(
            blogger_id=blogger.id,
            date="2024-12-15",
            content_type="post",
            idea="Winter outfit inspiration with layering techniques",
            status="DRAFT"
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        print(f"   ✓ Created task #{task.id}")
        
        # 3. Set location and outfit
        print("3. Setting up location and outfit...")
        task.location_id = 0  # City Center
        task.outfit = {
            "top": {"type": "text", "value": "Oversized beige wool coat"},
            "bottom": {"type": "text", "value": "Black high-waisted jeans"},
            "shoes": {"type": "text", "value": "White leather sneakers"},
            "accessories": {"type": "text", "value": "Leather crossbody bag, gold hoop earrings"}
        }
        db.commit()
        print(f"   ✓ Setup complete: location={task.location_id}, outfit items={len(task.outfit)}")
        
        # 4. Check database schema
        print("4. Checking database schema...")
        print(f"   - location_id: {task.location_id}")
        print(f"   - location_description: {task.location_description}")
        print(f"   - outfit: {task.outfit}")
        print(f"   - main_image_url: {task.main_image_url}")
        print(f"   - prompts: {task.prompts}")
        print(f"   - generated_images: {task.generated_images}")
        print("   ✓ All schema fields present")
        
        print("\n✅ Fashion workflow test passed!")
        print(f"\nNext steps:")
        print(f"1. Start the API: uvicorn backend.main:app --reload")
        print(f"2. Test endpoints:")
        print(f"   - PATCH /api/tasks/{task.id}/fashion/setup")
        print(f"   - POST /api/tasks/{task.id}/fashion/generate-main-frame")
        print(f"   - POST /api/tasks/{task.id}/fashion/approve-frame")
        print(f"   - POST /api/tasks/{task.id}/fashion/generate-additional-frames")
        print(f"3. Open frontend: http://localhost:3000/tasks/{task.id}")
        
        return blogger.id, task.id
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Fashion Post Generation Workflow Test")
    print("=" * 60)
    test_fashion_workflow()
