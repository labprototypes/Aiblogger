# Changelog

## [2024-10-29] - System Improvements Phase 7

### ✨ Added

**1. Dashboard Page with Analytics**
- ✅ New `/dashboard` route with comprehensive analytics
- ✅ 4 key metric cards: Total tasks, Tasks this week, Completion rate, In progress
- ✅ Line chart: Tasks over time (last 30 days)
- ✅ Pie chart: Status distribution with color coding
- ✅ Bar chart: Content type distribution
- ✅ Horizontal bar chart: Tasks by blogger
- ✅ Detailed status breakdown table with percentages
- ✅ Auto-refresh button for real-time updates

**2. Stats API Endpoint**
- ✅ New `GET /api/tasks/stats` endpoint
- ✅ Aggregates data from database with SQLAlchemy
- ✅ Returns comprehensive statistics:
  - Total tasks count
  - Tasks this week (Monday-Sunday)
  - Completion rate (APPROVED + PUBLISHED / total)
  - Status distribution (count by status)
  - Content type distribution (count by type)
  - Tasks over time (daily counts for last 30 days)
  - Tasks by blogger (count by blogger name)

**3. Dashboard Components**
- ✅ `DashboardCard` component for metric display
- ✅ Support for icons, subtitles, trend indicators
- ✅ Responsive grid layout (1/2/4 columns)
- ✅ Recharts integration for data visualization

**4. Navigation**
- ✅ Added "📊 Dashboard" link to header
- ✅ Easy access from any page

### 🔄 Changed

**Modified Files:**
- `backend/routes/tasks.py`:
  - Added `/stats` endpoint with complex aggregations
  - Uses SQLAlchemy func.count() and group_by()
  - Calculates completion rate, weekly tasks, daily trends
  - Joins Blogger table for blogger names

- `frontend/lib/api.ts`:
  - Added `tasks.getStats()` method
  - Type definitions for stats response
  
- `frontend/app/dashboard/page.tsx` (NEW, 320 lines):
  - Main dashboard page component
  - 4 metric cards at top
  - 4 charts (line, 2 pie/bar, horizontal bar)
  - Status breakdown table
  - Real-time data loading with useEffect
  - Recharts configuration with custom colors

- `frontend/components/DashboardCard.tsx` (NEW):
  - Reusable metric card component
  - Icon, title, value, subtitle, trend support
  - Hover effects and transitions

- `frontend/components/Header.tsx`:
  - Added Dashboard link to navigation

**Dependencies:**
- Added `recharts` for charts (39 packages)

### 📝 Technical Details

**Stats Calculation Logic:**
```python
# Completion rate
completed = APPROVED + PUBLISHED
completion_rate = (completed / total) * 100

# Weekly tasks (Monday-Sunday)
week_start = today - timedelta(days=today.weekday())
week_end = week_start + timedelta(days=6)
tasks_this_week = tasks WHERE date BETWEEN week_start AND week_end

# Daily trends (last 30 days)
thirty_days_ago = today - timedelta(days=30)
tasks_over_time = GROUP BY date WHERE date >= thirty_days_ago
```

**Chart Configuration:**
- Line chart: Tasks over time with smooth curve
- Pie chart: Status distribution with percentages
- Bar chart: Content types with color variation
- Horizontal bar: Bloggers sorted by task count
- Custom colors matching status system
- Responsive containers (100% width, 300px height)
- Dark theme tooltips

**Color Coding:**
- DRAFT: Gray (#6b7280)
- SETUP_READY: Blue (#3b82f6)
- GENERATING: Orange (#f59e0b)
- REVIEW: Purple (#8b5cf6)
- APPROVED: Green (#10b981)
- PUBLISHED: Lime (#84cc16)

### 🎯 Impact

**Before Phase 7:**
- No visibility into overall progress
- No data-driven decision making
- Manual counting of tasks
- No performance tracking

**After Phase 7:**
- 📊 Real-time analytics dashboard
- 📈 Visual trends and patterns
- 🎯 Completion rate tracking
- 👥 Blogger performance comparison
- 📅 Weekly workload visibility
- 🔄 One-click refresh

### 🚀 Benefits

1. **Data Visibility**: See all metrics at a glance
2. **Trend Analysis**: Track task creation over time
3. **Performance Tracking**: Monitor completion rates
4. **Resource Allocation**: Identify busy/idle periods
5. **Content Planning**: See content type distribution
6. **Team Insights**: Compare blogger productivity
7. **Quick Overview**: Replace manual Excel tracking

### 📊 Dashboard Features

**Key Metrics:**
- Total tasks (all time)
- Tasks this week (current workload)
- Completion rate % (quality metric)
- In progress count (active work)

**Visual Analytics:**
- 30-day trend line (growth tracking)
- Status pie chart (pipeline health)
- Content type bars (content mix)
- Blogger comparison (workload balance)

**Actionable Insights:**
- Identify bottlenecks (tasks stuck in REVIEW)
- Plan resources (weekly workload)
- Balance content types
- Optimize blogger assignments

---

## [2024-10-29] - System Improvements Phase 6

### ✨ Added

**1. Inline Outfit Creation**
- ✅ Mode selector: "👔 Готовые образы" OR "✏️ Собрать свой"
- ✅ "➕ Создать preset" button for creating reusable outfits
- ✅ Modal with parts upload (top/bottom/shoes/accessories)
- ✅ AI generates composite full-height outfit image via Seedream v4
- ✅ Auto-selects newly created outfit
- ✅ Preset outfits stored in blogger profile for reuse
- ✅ No need to navigate to blogger settings

**2. Preset Outfit Selection**
- ✅ Grid view of blogger's preset outfits with 3:4 aspect ratio
- ✅ Click to select → auto-fills outfit parts
- ✅ Visual indication of selected preset (checkmark + highlight)
- ✅ Seamless switching between preset and custom modes

### 🔄 Changed

**Modified Files:**
- `frontend/app/tasks/[id]/OutfitBuilder.tsx`:
  - Added mode selector (preset vs custom)
  - Added inline creation modal with parts upload
  - Added preset outfit grid display
  - Added `bloggerId`, `bloggerOutfits`, `selectedPresetId` props
  - Added `onPresetSelect`, `onOutfitCreated` callbacks
  - Added `handleGenerateOutfit`, `handleAcceptGenerated` functions
  - Auto-converts preset parts to custom outfit format on selection
  
- `frontend/app/tasks/[id]/FashionPostTask.tsx`:
  - Added `bloggerOutfits` state management
  - Added `selectedOutfitId` state for tracking preset selection
  - Added `handleOutfitCreated` callback
  - Added `handleOutfitSelect` with preset → custom conversion
  - Updated `Blogger` type to include `outfits` array
  - Passes all new props to `OutfitBuilder`

### 📝 Technical Details

**Inline Creation Flow:**
1. User clicks "➕ Создать preset" in OutfitBuilder
2. Modal opens for parts upload (top/bottom/shoes/accessories)
3. Upload at least 1 part → Click "Сгенерировать образ"
4. POST `/api/bloggers/{id}/outfits/generate` with parts
5. AI generates composite full-height outfit image (3:4 aspect ratio)
6. Preview → Accept → POST `/api/bloggers/{id}/outfits` to save
7. Parent receives new outfit via `onOutfitCreated`
8. Auto-selects new preset (last index in array)
9. Preset parts auto-populate custom outfit builder

**Preset Selection Logic:**
```typescript
const handleOutfitSelect = (presetId: number | null) => {
  setSelectedOutfitId(presetId);
  if (presetId !== null && bloggerOutfits[presetId]) {
    const preset = bloggerOutfits[presetId];
    const customOutfit = {
      top: preset.parts?.top ? { type: "image", value: preset.parts.top } : undefined,
      bottom: preset.parts?.bottom ? { type: "image", value: preset.parts.bottom } : undefined,
      // ... other parts
    };
    setOutfit(customOutfit);
  }
};
```

**API Endpoints Used:**
- `POST /api/bloggers/{id}/outfits/generate` - Generate composite outfit with Seedream v4
- `POST /api/bloggers/{id}/outfits` - Save outfit to blogger profile
- `PATCH /api/tasks/{id}/fashion-setup` - Auto-save with outfit data

### 🎯 Impact

**Before Phase 6:**
- Manual outfit building only (top/bottom/shoes/accessories)
- Navigate to blogger settings → create outfit → back to task → rebuild manually
- 7+ steps to reuse an outfit
- No visual presets

**After Phase 6:**
- Preset outfits OR custom building
- Click preset → auto-populated
- Create preset → 2 clicks → auto-select
- **~80% faster workflow** for outfit selection
- Reusable outfit library
- Visual grid for quick selection

### 🚀 Benefits

1. **Preset Library**: Reusable outfits across tasks
2. **Faster Workflow**: 1 click to select preset vs manual rebuild
3. **Visual Selection**: Grid view with thumbnails
4. **Seamless Creation**: Inline modal without navigation
5. **AI Composite**: Generates full outfit from parts
6. **Flexibility**: Switch between preset and custom modes
7. **Consistency**: Same outfit across multiple posts

---

## [2024-10-29] - System Improvements Phase 5

### ✨ Added

**1. Auto-Save in Task Setup**
- ✅ Real-time auto-save for task configuration (location, outfit, description)
- ✅ 1.5s debounce to prevent excessive API calls
- ✅ Visual feedback via SaveIndicator (pending → saving → saved → idle)
- ✅ No manual "Save" button required - just switch to generation tab
- ✅ Prevents data loss from forgotten changes

**2. Inline Location Creation**
- ✅ "➕ Создать новую" button directly in LocationSelector
- ✅ Modal with 2 modes: Upload image OR Generate via AI
- ✅ Upload mode: Title + image upload → instant creation
- ✅ Generate mode: Text prompt → Seedream v4 → preview → accept
- ✅ Auto-selects newly created location
- ✅ No need to navigate to blogger settings
- ✅ Seamless workflow for new locations during task creation

### 🔄 Changed

**Modified Files:**
- `frontend/app/tasks/[id]/FashionPostTask.tsx`:
  - Integrated `useAutoSave` hook for setup fields
  - Added `SaveIndicator` component
  - Removed manual save button, replaced with auto-save
  - Added state management for blogger locations
  - Added `handleLocationCreated` callback
  
- `frontend/app/tasks/[id]/LocationSelector.tsx`:
  - Added `bloggerId` prop for inline creation
  - Added `onLocationCreated` callback prop
  - Added inline creation modal with upload/generate modes
  - Added `handleCreateUpload`, `handleGenerate`, `handleAcceptGenerated` functions
  - Auto-selects newly created location

### 📝 Technical Details

**Auto-Save Implementation:**
```typescript
const saveSetup = async (data: { location_id, location_description, outfit }) => {
  await api.tasks.updateFashionSetup(task.id, data);
};
const [triggerSave, saveStatus] = useAutoSave(saveSetup, 1500);

useEffect(() => {
  if (activeTab === "setup") {
    triggerSave({ location_id, location_description, outfit });
  }
}, [selectedLocationId, locationDescription, outfit, activeTab]);
```

**Inline Creation Flow:**
1. User clicks "➕ Создать новую" in LocationSelector
2. Modal opens with Upload/Generate tabs
3. Upload: Title + image → POST `/api/bloggers/{id}/locations` → callback
4. Generate: Prompt → POST `/api/bloggers/{id}/locations/generate` → preview → accept → POST → callback
5. Parent component receives new location via `onLocationCreated`
6. Auto-selects new location (last index in array)

**API Endpoints Used:**
- `POST /api/bloggers/{id}/locations` - Add location to blogger
- `POST /api/bloggers/{id}/locations/generate` - Generate location with Seedream v4
- `PATCH /api/tasks/{id}/fashion-setup` - Auto-save task setup

### 🎯 Impact

**Before Phase 5:**
- Manual save required (button click)
- Forgot to save → lost changes
- Create location → navigate to blogger settings → add → back to task → select
- 5+ navigation steps for new location

**After Phase 5:**
- Auto-save every 1.5s after change
- Real-time feedback (saving/saved indicator)
- Create location → modal → generate/upload → auto-select
- 2 clicks for new location
- **~70% faster workflow**
- No more lost changes

### 🚀 Benefits

1. **Better UX**: Auto-save eliminates manual actions
2. **Faster workflow**: Inline creation reduces navigation
3. **Data safety**: Real-time saves prevent loss
4. **Seamless creation**: No context switching
5. **Clear feedback**: Visual indicators for save status

---

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
