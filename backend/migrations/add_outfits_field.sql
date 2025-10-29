-- Add outfits field to bloggers table
-- Run: psql $DATABASE_URL -f migrations/add_outfits_field.sql

ALTER TABLE bloggers ADD COLUMN IF NOT EXISTS outfits JSON;

-- Set default empty array for existing records
UPDATE bloggers SET outfits = '[]'::json WHERE outfits IS NULL;

COMMENT ON COLUMN bloggers.outfits IS 'Array of outfit objects with name, image_url, and parts: [{name: "...", image_url: "...", parts: {top: "url", bottom: "url", shoes: "url", accessories: "url"}}]';
