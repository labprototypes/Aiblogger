-- Migration: Add fashion post generation fields to content_tasks
-- Run this SQL in your Render PostgreSQL database

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
