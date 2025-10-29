-- Add podcaster-specific fields to bloggers table
-- Run: psql $DATABASE_URL -f migrations/add_podcaster_fields.sql

ALTER TABLE bloggers ADD COLUMN IF NOT EXISTS face_image VARCHAR(1024);
ALTER TABLE bloggers ADD COLUMN IF NOT EXISTS face_prompt TEXT;
ALTER TABLE bloggers ADD COLUMN IF NOT EXISTS animation_frames JSON;

-- Set default empty arrays for existing records
UPDATE bloggers SET animation_frames = '[]'::json WHERE animation_frames IS NULL AND type = 'podcaster';

COMMENT ON COLUMN bloggers.face_image IS 'Generated or uploaded face image (1:1, 4K format)';
COMMENT ON COLUMN bloggers.face_prompt IS 'Text prompt used to generate the face via Seedream v4';
COMMENT ON COLUMN bloggers.animation_frames IS 'Array of animation frame objects: [{id: "frame1", image_url: "...", prompt: "...", emotion: "..."}]';
