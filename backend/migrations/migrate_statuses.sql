-- Migrate task statuses to new unified system
-- Run: psql $DATABASE_URL -f migrations/migrate_statuses.sql

-- Update existing tasks to new status names
UPDATE content_tasks 
SET status = CASE
    WHEN status = 'PLANNED' THEN 'DRAFT'
    WHEN status = 'SCRIPT_READY' THEN 'SETUP_READY'
    WHEN status = 'VISUAL_READY' THEN 'REVIEW'
    WHEN status = 'MAIN_FRAME_APPROVED' THEN 'REVIEW'
    WHEN status IS NULL THEN 'DRAFT'
    ELSE status
END;

-- Add comment explaining new system
COMMENT ON COLUMN content_tasks.status IS 'Task status: DRAFT → SETUP_READY → GENERATING → REVIEW → APPROVED → PUBLISHED';
