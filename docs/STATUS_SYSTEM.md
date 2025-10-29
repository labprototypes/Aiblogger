# Task Status System

## New Unified Status Flow

```
DRAFT          → Task created, no work done yet
SETUP_READY    → Setup completed (location/outfit for fashion, script for podcaster)
GENERATING     → Worker processing (image/video/audio generation in progress)
REVIEW         → Content generated, waiting for approval
APPROVED       → Content approved, ready for publishing
PUBLISHED      → (Optional) Content published to social media
```

## Status by Content Type

### Fashion Posts
```
DRAFT → SETUP_READY (after location + outfit saved)
      → GENERATING (worker generating 4 frames)
      → REVIEW (all frames generated, awaiting approval)
      → APPROVED (all frames approved)
```

### Podcaster Video/Reel
```
DRAFT → SETUP_READY (after script generated)
      → GENERATING (worker processing video)
      → REVIEW (video generated, awaiting approval)
      → APPROVED (video approved)
```

### Podcaster Voice
```
DRAFT → SETUP_READY (after script generated)
      → GENERATING (ElevenLabs processing)
      → REVIEW (audio generated, awaiting approval)
      → APPROVED (audio approved)
```

## Migration from Old Statuses

```python
# Old → New mapping
DRAFT → DRAFT
PLANNED → DRAFT (deprecated autoplan)
SCRIPT_READY → SETUP_READY
VISUAL_READY → REVIEW
MAIN_FRAME_APPROVED → REVIEW (partial approval, still in review)
APPROVED → APPROVED
```

## Database Migration

```sql
-- Update existing tasks to new status system
UPDATE content_tasks 
SET status = CASE
    WHEN status = 'PLANNED' THEN 'DRAFT'
    WHEN status = 'SCRIPT_READY' THEN 'SETUP_READY'
    WHEN status = 'VISUAL_READY' THEN 'REVIEW'
    WHEN status = 'MAIN_FRAME_APPROVED' THEN 'REVIEW'
    ELSE status
END;
```

## UI Changes

**Status Colors:**
- DRAFT: Gray (bg-gray-700)
- SETUP_READY: Blue (bg-blue-700)
- GENERATING: Yellow (bg-yellow-700)
- REVIEW: Purple (bg-purple-700)
- APPROVED: Green (bg-green-700)

**Status Labels:**
- DRAFT: "Черновик"
- SETUP_READY: "Готов к генерации"
- GENERATING: "Генерируется..."
- REVIEW: "На проверке"
- APPROVED: "Одобрено"
