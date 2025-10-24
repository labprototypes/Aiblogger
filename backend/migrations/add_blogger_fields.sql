-- Migration: Add new fields to bloggers table
-- Run this SQL in your Render PostgreSQL database

-- Add locations column (JSON array of image URLs)
ALTER TABLE bloggers 
ADD COLUMN IF NOT EXISTS locations JSON DEFAULT '[]'::json;

-- Add editing_types_enabled column (JSON array of enabled editing types)
ALTER TABLE bloggers 
ADD COLUMN IF NOT EXISTS editing_types_enabled JSON DEFAULT '[]'::json;

-- Add subtitles_enabled column (0=disabled, 1=enabled for all)
ALTER TABLE bloggers 
ADD COLUMN IF NOT EXISTS subtitles_enabled INTEGER DEFAULT 0;

-- Add content_frequency column (JSON object with frequency settings)
ALTER TABLE bloggers 
ADD COLUMN IF NOT EXISTS content_frequency JSON DEFAULT '{}'::json;

-- Add editing_type to content_tasks table
ALTER TABLE content_tasks 
ADD COLUMN IF NOT EXISTS editing_type VARCHAR(50);

-- Update existing bloggers with default values if needed
UPDATE bloggers 
SET 
  locations = '[]'::json,
  editing_types_enabled = '[]'::json,
  subtitles_enabled = 0,
  content_frequency = '{}'::json
WHERE 
  locations IS NULL 
  OR editing_types_enabled IS NULL 
  OR subtitles_enabled IS NULL 
  OR content_frequency IS NULL;
