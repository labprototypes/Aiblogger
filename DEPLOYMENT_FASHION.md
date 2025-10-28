# Fashion Feature - Deployment Guide

## Pre-Deployment Checklist

### 1. Database Migration (PostgreSQL on Render)

Connect to your Render PostgreSQL database and run:

```sql
-- Add fashion-specific columns to bloggers table
ALTER TABLE bloggers 
ADD COLUMN IF NOT EXISTS locations JSON;

-- Add fashion-specific columns to content_tasks table
ALTER TABLE content_tasks 
ADD COLUMN IF NOT EXISTS location_id INTEGER;

ALTER TABLE content_tasks 
ADD COLUMN IF NOT EXISTS location_description TEXT;

ALTER TABLE content_tasks 
ADD COLUMN IF NOT EXISTS outfit JSON;

ALTER TABLE content_tasks 
ADD COLUMN IF NOT EXISTS main_image_url VARCHAR(1024);

ALTER TABLE content_tasks 
ADD COLUMN IF NOT EXISTS prompts JSON;

ALTER TABLE content_tasks 
ADD COLUMN IF NOT EXISTS generated_images JSON;

-- Update existing tasks with default values
UPDATE content_tasks 
SET 
  outfit = '{}'::json,
  prompts = '{}'::json,
  generated_images = '{}'::json
WHERE 
  outfit IS NULL 
  OR prompts IS NULL 
  OR generated_images IS NULL;
```

### 2. Environment Variables

Add to all Render services (Web, Worker, Frontend):

```
FAL_API_KEY=your_fal_api_key_here
```

Get your FAL API key from: https://fal.ai/dashboard

### 3. Code Changes Summary

**Backend:**
- `backend/db/models.py` - Added 7 new columns (1 in Blogger, 6 in ContentTask)
- `backend/routes/tasks.py` - Added 4 new endpoints for fashion generation
- `backend/utils/image_generation.py` (NEW) - FAL.ai integration
- `backend/requirements.txt` - Added `requests>=2.31.0`

**Frontend:**
- `frontend/lib/api.ts` - Extended types and added 4 fashion API methods
- `frontend/app/tasks/[id]/page.tsx` - Added conditional routing for fashion posts
- `frontend/app/tasks/[id]/LocationSelector.tsx` (NEW) - 120 lines
- `frontend/app/tasks/[id]/OutfitBuilder.tsx` (NEW) - 130 lines
- `frontend/app/tasks/[id]/FashionFrameGenerator.tsx` (NEW) - 230 lines
- `frontend/app/tasks/[id]/FashionPostTask.tsx` (NEW) - 234 lines

## Deployment Steps

### Option 1: Via Git Push (Recommended)

```bash
# 1. Commit all changes
git add .
git commit -m "feat: Add fashion post generation with SDXL 4.0

- Multi-step workflow: location → outfit → main frame → 3 angles
- Integration with FAL.ai FLUX Pro API
- Extended database schema with 7 new fields
- 4 new API endpoints for generation workflow
- Complete UI with tabs, prompt editing, regeneration"

# 2. Push to main
git push origin main

# 3. Render will auto-deploy if connected to repo
```

### Option 2: Manual Render Sync

1. Go to Render Dashboard
2. Select your Blueprint instance
3. Click "Manual Sync"
4. Wait for all services to redeploy

### 4. Post-Deployment Verification

**Backend Health Check:**
```bash
curl https://your-api.onrender.com/health
# Should return: {"ok": true}
```

**Database Schema Check:**
```bash
# Connect to Render PostgreSQL
psql $DATABASE_URL

# Verify columns exist
\d bloggers
\d content_tasks

# Should see: locations, location_id, location_description, outfit, main_image_url, prompts, generated_images
```

**API Endpoints Test:**
```bash
# Create a fashion blogger
curl -X POST https://your-api.onrender.com/api/bloggers/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Fashion",
    "type": "fashion"
  }'

# Create a post task
curl -X POST https://your-api.onrender.com/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "blogger_id": 1,
    "date": "2024-12-20",
    "content_type": "post",
    "idea": "Winter fashion lookbook"
  }'

# Test fashion setup endpoint
curl -X PATCH https://your-api.onrender.com/api/tasks/1/fashion/setup \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": 0,
    "outfit": {"top": {"type": "text", "value": "Black turtleneck"}}
  }'
```

**Frontend Check:**
1. Open https://your-frontend.onrender.com
2. Create a fashion blogger with type="fashion"
3. Add locations in blogger edit form
4. Create a post task
5. Open task → should see FashionPostTask UI with tabs

### 5. Common Issues & Solutions

**Issue: "No column named locations"**
- Solution: Run the ALTER TABLE migration SQL

**Issue: "FAL_API_KEY not set"**
- Solution: Add FAL_API_KEY to Render environment variables
- Restart all services after adding

**Issue: "Cannot import image_generation"**
- Solution: Ensure `requests` is in requirements.txt
- Rebuild/redeploy backend service

**Issue: Frontend shows standard task page instead of FashionPostTask**
- Solution: Check blogger.type === "fashion" and task.content_type === "post"
- Verify conditional logic in tasks/[id]/page.tsx

**Issue: "Generation failed" error**
- Solution: Check FAL.ai API key is valid
- Check backend logs for detailed error
- Verify FAL.ai account has credits

## Rollback Plan

If deployment fails:

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset database (CAUTION: loses data)
# Just remove the new columns:
ALTER TABLE content_tasks DROP COLUMN IF EXISTS location_id;
ALTER TABLE content_tasks DROP COLUMN IF EXISTS location_description;
ALTER TABLE content_tasks DROP COLUMN IF EXISTS outfit;
ALTER TABLE content_tasks DROP COLUMN IF EXISTS main_image_url;
ALTER TABLE content_tasks DROP COLUMN IF EXISTS prompts;
ALTER TABLE content_tasks DROP COLUMN IF EXISTS generated_images;
ALTER TABLE bloggers DROP COLUMN IF EXISTS locations;
```

## Monitoring

**Key Metrics:**
- API response time for /fashion/generate-main-frame (expect 30-60s)
- FAL.ai API quota usage
- S3 storage usage for generated images
- Error rate for generation endpoints

**Logs to Watch:**
```bash
# Render backend logs
# Look for: "Generation failed", "FAL.ai API request failed"

# Check worker logs if using background tasks
# Look for: RQ job failures
```

## Next Steps After Deployment

1. Test complete workflow end-to-end
2. Monitor FAL.ai API usage and costs
3. Implement S3 persistence (currently using 24h temporary URLs)
4. Add retry logic for failed generations
5. Implement individual angle regeneration
6. Add loading states and progress bars
7. Integrate outfit/location context into ChatGPT script generation

## Support

- FAL.ai docs: https://fal.ai/models/fal-ai/flux-pro
- Render docs: https://render.com/docs
- Project docs: See FASHION_FEATURE.md
