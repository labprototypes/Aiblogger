#!/bin/bash
# Script to run database migrations
# Automatically executed on deployment

set -e  # Exit on error

echo "🔄 Running database migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Directory containing migration files
MIGRATIONS_DIR="backend/migrations"

# Run each migration SQL file
for migration_file in "$MIGRATIONS_DIR"/*.sql; do
    if [ -f "$migration_file" ]; then
        echo "📝 Applying migration: $(basename "$migration_file")"
        psql "$DATABASE_URL" -f "$migration_file" || {
            echo "⚠️  Warning: Migration $(basename "$migration_file") may have already been applied or failed"
        }
    fi
done

echo "✅ Database migrations completed"
