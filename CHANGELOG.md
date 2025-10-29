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

- [ ] Unified status system (DRAFT → SETUP_READY → GENERATING → REVIEW → APPROVED)
- [ ] Fashion worker for background generation
- [ ] Auto-save in forms
- [ ] Cleanup legacy code (content_plan_worker, generation.py)
