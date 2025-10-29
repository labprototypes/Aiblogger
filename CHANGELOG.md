# Changelog

## [2024-10-29] - System Improvements Phase 1

### 🔄 Changed

**1. FAL.ai Model Routing (Seedream v4)**
- ✅ Switched from FLUX Pro to Seedream v4 models
- ✅ **Text-to-Image**: Uses `fal-ai/bytedance/seedream/v4/text-to-image` when only text prompt
- ✅ **Edit Mode**: Uses `fal-ai/bytedance/seedream/v4/edit` when text + reference image
- ✅ Added support for reference images in all generation endpoints
- ✅ Fashion main frame: Uses outfit part URLs as reference if available
- ✅ Additional frames: Uses approved main frame as reference for consistency
- ✅ Outfit generation: Uses first part image as reference

**2. S3 Persistence for Images**
- ✅ All generated images now automatically uploaded to S3
- ✅ Prevents 24h FAL.ai URL expiration
- ✅ Falls back to FAL URL if S3 not configured (dev mode)
- ✅ Uses `fashion/{uuid}.jpg` naming pattern
- ✅ Public-read ACL for direct access

**3. Enhanced Image Generation**
- ✅ Added aspect ratio support: 9:16, 4:5, 16:9, 3:4, 1:1
- ✅ Logging for debugging (Seedream mode, URLs)
- ✅ Better error handling with descriptive messages

### 📝 Technical Details

**Modified Files:**
- `backend/utils/image_generation.py` - Complete rewrite with Seedream v4 + S3
- `backend/routes/bloggers.py` - Outfit generation uses reference images
- `backend/routes/tasks.py` - Main/additional frames use reference images

**New Features:**
- `generate_fashion_frame()` now accepts `reference_image` parameter
- `upload_fal_image_to_s3()` improved with better error handling
- Automatic routing between text-to-image and edit modes

**Environment Variables Required:**
```bash
FAL_API_KEY=fal_...              # FAL.ai API key
AWS_ACCESS_KEY_ID=AKIA...        # S3 access
AWS_SECRET_ACCESS_KEY=...        # S3 secret
AWS_S3_BUCKET=your-bucket        # S3 bucket name
AWS_REGION=us-east-1             # S3 region
```

### 🎯 Impact

**Before:**
- Images used FLUX Pro (less fashion-specific)
- URLs expired after 24h
- No reference image support
- Inconsistent angle generation

**After:**
- ✅ Seedream v4 optimized for fashion content
- ✅ Permanent S3 storage
- ✅ Reference images for style consistency
- ✅ Additional angles match main frame style

### 🔜 Next Steps (Phase 2)

- [x] Unified status system (DRAFT → SETUP_READY → GENERATING → REVIEW → APPROVED → PUBLISHED)
- [ ] Fashion worker for background generation
- [ ] Auto-save in forms
- [ ] Cleanup legacy code (content_plan_worker, generation.py)

## [2024-10-29] - Phase 2: Status System Unification

### 🔄 Changed

**1. Unified Task Status System**
- ✅ Replaced old statuses: PLANNED, SCRIPT_READY, VISUAL_READY, MAIN_FRAME_APPROVED
- ✅ New unified flow: DRAFT → SETUP_READY → GENERATING → REVIEW → APPROVED → PUBLISHED
- ✅ Updated all workers to use REVIEW instead of VISUAL_READY
- ✅ Frontend status colors updated across calendar, task views
- ✅ Backend routes updated for new status transitions

**2. Status Workflow by Content Type**

**Fashion Posts:**
- DRAFT (created) → SETUP_READY (location+outfit configured) → GENERATING (frames generating) → REVIEW (awaiting approval) → APPROVED

**Podcaster Video/Audio:**
- DRAFT (created) → SETUP_READY (script generated) → GENERATING (worker processing) → REVIEW (content ready) → APPROVED

**3. Migration**
- Created `migrations/migrate_statuses.sql` for database migration
- PLANNED → DRAFT
- SCRIPT_READY → SETUP_READY  
- VISUAL_READY, MAIN_FRAME_APPROVED → REVIEW

### 📝 Technical Details

**Modified Files:**
- `backend/routes/tasks.py` - Updated status transitions
- `backend/workers/*.py` - All workers now set REVIEW status
- `frontend/lib/api.ts` - Updated TASK_STATUSES constant
- `frontend/app/calendar/*.tsx` - New status colors
- `docs/STATUS_SYSTEM.md` - Complete status documentation

### 🎯 Impact

**Before:**
- 7 different statuses with unclear meanings
- MAIN_FRAME_APPROVED specific to fashion
- Confusing SCRIPT_READY vs VISUAL_READY

**After:**
- ✅ 6 clear statuses with universal meaning
- ✅ Works for all content types
- ✅ Clear progression: setup → generation → review → approval
