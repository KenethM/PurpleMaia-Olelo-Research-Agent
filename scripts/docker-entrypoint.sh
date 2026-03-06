#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."

run_migration() {
  SQL=$1
  echo "[entrypoint] Applying $SQL..."
  npx tsx scripts/migrate/run-sql.ts "$SQL" 2>&1 && echo "[entrypoint] OK: $SQL" || echo "[entrypoint] Skipped (already applied): $SQL"
}

run_migration src/db/migrations/000001_create_initial_tables.up.sql
run_migration src/db/migrations/000002_create_multi_tenant_tables.up.sql
run_migration src/db/migrations/000003_create_research_tables.up.sql
run_migration src/db/migrations/000004_create_feedback_table.up.sql

echo "[entrypoint] Migrations complete. Starting app..."
exec npm run start
