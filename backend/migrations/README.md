# Database Migrations

This directory contains SQL migration files for the Aiblogger database.

## Automatic Deployment

Migrations are automatically applied during deployment via `run_migrations.sh`.

## Available Migrations

1. **add_blogger_fields.sql** - Adds basic blogger profile fields
2. **add_fashion_generation_fields.sql** - Adds fashion post generation fields to tasks
3. **add_outfits_field.sql** - Adds outfits JSON column to bloggers table
4. **migrate_statuses.sql** - Migrates to unified 6-status system

## Manual Execution

To manually run migrations on production:

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://user:password@host:port/database"

# Run all migrations
bash backend/migrations/run_migrations.sh

# Or run specific migration
psql $DATABASE_URL -f backend/migrations/add_outfits_field.sql
```

## Local Development

For local development, migrations run automatically on first API start. Alternatively:

```bash
# Using local .env
source .env
psql $DATABASE_URL -f backend/migrations/add_outfits_field.sql
```

## Creating New Migrations

1. Create a new `.sql` file in this directory
2. Use `IF NOT EXISTS` or similar idempotent SQL
3. Add comments describing the migration
4. The migration will auto-run on next deployment

Example:

```sql
-- Add new_field to table
-- Run: psql $DATABASE_URL -f migrations/add_new_field.sql

ALTER TABLE table_name ADD COLUMN IF NOT EXISTS new_field VARCHAR(255);
UPDATE table_name SET new_field = 'default_value' WHERE new_field IS NULL;
COMMENT ON COLUMN table_name.new_field IS 'Description of the field';
```

## Troubleshooting

**Migration already applied:**
- Migrations use `IF NOT EXISTS` and similar clauses to be idempotent
- Safe to run multiple times

**Connection issues:**
- Ensure DATABASE_URL is correctly set
- Check firewall/IP allowlist settings on Render

**Column conflicts:**
- Review model changes in `backend/db/models.py`
- Ensure migration SQL matches model definitions
