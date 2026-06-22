#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────────────────────
# Development Server Startup Script
# 1. Kill services on ports 3100, 4000
# 2. Verify shared PostgreSQL container is running
# 3. Create project database if needed
# 4. Push Drizzle schema
# 5. Launch web + API dev servers
# ─────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_ROOT/.env" ]; then
  export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

DB_CONTAINER="${POSTGRES_CONTAINER:-postgres-local}"
DB_NAME="${POSTGRES_DB:-admin_app_template_dev}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_ADMIN_DB="${POSTGRES_ADMIN_DB:-postgres}"

ensure_container_running() {
  if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo "Starting PostgreSQL container '${DB_CONTAINER}'..."
    docker compose up -d postgres
  fi
}

wait_for_postgres() {
  local retries=30
  while [ $retries -gt 0 ]; do
    if docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
      return 0
    fi
    retries=$((retries - 1))
    sleep 1
  done
  return 1
}

ensure_database_exists() {
  local db_exists
  db_exists=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_ADMIN_DB" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null)
  if [ "$db_exists" != "1" ]; then
    echo "Creating database '$DB_NAME'..."
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_ADMIN_DB" -c "CREATE DATABASE $DB_NAME;"
  fi
}

push_schema() {
  cd "$PROJECT_ROOT"
  pnpm --filter @admin-template/db db:push
}

run_schema_setup() {
  ensure_database_exists
  push_schema
}

echo "Starting development environment..."
echo ""

echo "Killing existing services on ports 3100, 4000..."
for PORT in 3100 4000; do
  lsof -ti tcp:"$PORT" | xargs kill -9 2>/dev/null || true
done
sleep 2
echo "Ports cleared"
echo ""

echo "Checking PostgreSQL container '${DB_CONTAINER}'..."
cd "$PROJECT_ROOT"
ensure_container_running

if wait_for_postgres; then
  echo "PostgreSQL is ready"
else
  echo "Warning: PostgreSQL may not be ready yet"
fi

echo ""
ensure_database_exists
run_schema_setup

echo ""
echo "Starting MinIO..."
docker compose up -d minio minio-setup 2>/dev/null || echo "Warning: MinIO compose services not available (continuing without MinIO)"
sleep 3
echo "MinIO ready"
echo ""

echo "Starting workspace dev servers..."
exec pnpm -r --parallel --filter '@admin-template/api-server' --filter '@admin-template/web' dev
