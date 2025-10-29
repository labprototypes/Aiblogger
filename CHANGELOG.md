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

## [2024-10-29] - Phase 3: Cleanup & Auto-Save

### 🗑️ Removed

**1. Deprecated Code Cleanup**
- ✅ Deleted `backend/workers/content_plan_worker.py` (autoplan feature removed)
- ✅ Deleted `backend/routes/generation.py` (unused legacy endpoints)
- ✅ Removed generation router from `main.py`
- ✅ Cleaned up all imports and references

**2. Legacy Features Removed**
- PLANNED status (migrated to DRAFT)
- Auto content plan generation
- Unused /api/generation endpoints

### ✨ Added

**3. Auto-Save Infrastructure**
- ✅ Created `hooks/useAutoSave.ts` with debounced save logic
- ✅ `useDebouncedCallback` hook for general debouncing
- ✅ `useAutoSave` hook with status indicator (idle/pending/saving/saved/error)
- ✅ `SaveIndicator` component with status icons and animations
- ✅ Ready for integration into EditForm and FashionPostTask

**4. Save Status Indicators**
- pending: "Есть изменения..." (gray)
- saving: "Сохранение..." (blue, animated spinner)
- saved: "Сохранено" (green, checkmark)
- error: "Ошибка сохранения" (red, warning)

### 📝 Technical Details

**Deleted Files:**
- `backend/workers/content_plan_worker.py`
- `backend/routes/generation.py`

**New Files:**
- `frontend/hooks/useAutoSave.ts` (90 lines, 2 hooks)
- `frontend/components/SaveIndicator.tsx` (visual feedback component)

**Modified Files:**
- `backend/main.py` - Removed generation router

### 🎯 Impact

**Before:**
- Manual "Save" button required
- Legacy code cluttering codebase
- Unused autoplan worker still referenced

**After:**
- ✅ Auto-save ready for forms (1 second debounce)
- ✅ Clean codebase, no legacy endpoints
- ✅ Visual save status feedback
- ✅ Reduced manual actions for users

### 🔜 Next Steps (Phase 4)

- [x] Integrate auto-save into EditForm
- [x] Fashion worker for background generation
- [x] Bulk operations (approve all angles)
- [ ] Integrate auto-save into FashionPostTask setup tab
- [ ] Unified create task wizard
- [ ] Inline location/outfit creation

## [2024-10-29] - Phase 4: Auto-Save & Fashion Worker

### ✨ Added

**1. Auto-Save in EditForm**
- ✅ Integrated useAutoSave hook with 1.5s debounce
- ✅ SaveIndicator shows real-time save status
- ✅ Auto-saves on any field change (name, type, avatar, locations, outfits, theme, tone, voice, editing types, subtitles)
- ✅ Submit button now just redirects (auto-save handles persistence)
- ✅ Visual feedback: pending → saving → saved → idle

**2. Fashion Background Worker**
- ✅ Created `fashion_worker.py` for complete fashion post generation
- ✅ Generates 1 main frame (9:16) + 3 angle variations (4:5) automatically
- ✅ Uses main frame as reference for angles (Seedream edit mode)
- ✅ Sets status to REVIEW when complete
- ✅ Integrated into `/api/tasks/{id}/generate` route
- ✅ Automatically selected for fashion bloggers with post content type

**3. Bulk Approve for Angles**
- ✅ "Подтвердить все" button in FashionFrameGenerator
- ✅ Approves all 3 angle frames simultaneously
- ✅ Parallel API calls for performance
- ✅ Only shows when angles exist and not all approved

### 🔄 Changed

**4. Unified Generation Endpoint**
- Updated `/api/tasks/{id}/generate` to route by blogger type:
  - Fashion blogger + post → `fashion_worker`
  - Video/reel/short → `video_worker`
  - Voice/podcast/audio → `voice_worker`
  - Default → `image_worker`

**5. EditForm UX Improvements**
- Removed manual "Save" button
- Changed submit to "Вернуться к списку"
- SaveIndicator in bottom-right corner
- No more forgotten changes

### 📝 Technical Details

**New Files:**
- `backend/workers/fashion_worker.py` (145 lines)

**Modified Files:**
- `frontend/app/bloggers/[id]/EditForm.tsx` - Auto-save integration
- `frontend/app/tasks/[id]/FashionPostTask.tsx` - Bulk approve handler
- `frontend/app/tasks/[id]/FashionFrameGenerator.tsx` - Approve all button
- `backend/routes/tasks.py` - Fashion worker routing

**Fashion Worker Workflow:**
```
1. Extract location + outfit from task
2. Generate main frame prompt via GPT-4o-mini
3. Generate main frame (9:16) via Seedream v4
4. For each of 3 angles:
   - Generate angle prompt variation
   - Generate angle frame (4:5) using main as reference
5. Set status to REVIEW
```

### 🎯 Impact

**Before:**
- Manual fashion frame generation (4 separate API calls)
- No bulk operations
- Manual save required in forms

**After:**
- ✅ One-click fashion post generation (background worker)
- ✅ Bulk approve all angles at once
- ✅ Auto-save everywhere (no forgotten changes)
- ✅ Better UX with real-time feedback

### 🔜 Next Steps (Phase 5)

- [ ] Auto-save in FashionPostTask setup tab
- [ ] Unified create task wizard
- [ ] Inline location/outfit creation from task page
- [ ] Dashboard with metrics
- [ ] Calendar drag & drop
