#!/bin/bash

# Database setup script for karir-fit
# Usage: ./scripts/db-setup.sh [command]
# Commands: start, stop, reset, migrate, studio, status

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
elif [ -f "$PROJECT_ROOT/apps/server/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/apps/server/.env" | xargs)
fi

# Default values
DB_NAME=${POSTGRES_DB:-admin_app_template_dev}
DB_USER=${POSTGRES_USER:-postgres}
DB_PASSWORD=${POSTGRES_PASSWORD:-postgres}
DB_PORT=${POSTGRES_PORT:-5432}
DB_HOST=${POSTGRES_HOST:-localhost}
DB_CONTAINER=${POSTGRES_CONTAINER:-postgres-local}
DB_ADMIN_DB=${POSTGRES_ADMIN_DB:-postgres}

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  karir-fit Database Setup${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo "Install Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker is not running"
        echo "Start Docker and try again"
        exit 1
    fi

    print_success "Docker is running"
}

check_container_exists() {
    docker ps -a --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"
}

check_container_running() {
    docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"
}

wait_for_postgres() {
    local retries=30
    while [ $retries -gt 0 ]; do
        if docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_ADMIN_DB" &> /dev/null; then
            return 0
        fi
        retries=$((retries - 1))
        sleep 1
    done
    return 1
}

ensure_database_exists() {
    local exists
    exists=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_ADMIN_DB" -tAc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'")

    if [ "$exists" = "1" ]; then
        print_success "Database '$DB_NAME' already exists"
        return 0
    fi

    echo "Creating database '$DB_NAME'..."
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_ADMIN_DB" -c "CREATE DATABASE \"${DB_NAME}\""
    print_success "Database '$DB_NAME' created"
}

start_db() {
    print_header
    check_docker

    if ! check_container_running; then
        print_error "Shared PostgreSQL container '$DB_CONTAINER' is not running"
        echo "Start it first: docker start $DB_CONTAINER"
        echo "Or use fallback project container explicitly: bun run docker:up"
        exit 1
    fi

    echo "Using shared PostgreSQL container '$DB_CONTAINER'..."
    echo ""
    echo "Waiting for PostgreSQL to be healthy..."

    if ! wait_for_postgres; then
        print_error "PostgreSQL did not become ready"
        exit 1
    fi

    print_success "PostgreSQL is running and healthy"
    ensure_database_exists
    echo ""
    echo -e "Connection URL: ${GREEN}postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME${NC}"
    echo ""
}

stop_db() {
    print_header
    print_info "Shared container '$DB_CONTAINER' is not managed by this project"
    echo "Leave it running for other projects. Stop manually if needed:"
    echo "  docker stop $DB_CONTAINER"
}

reset_db() {
    print_header
    check_docker

    if ! check_container_running; then
        print_error "Shared PostgreSQL container '$DB_CONTAINER' is not running"
        exit 1
    fi

    echo -e "${YELLOW}⚠️  This will delete only database '$DB_NAME' inside shared container '$DB_CONTAINER'.${NC}"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_ADMIN_DB" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" > /dev/null
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_ADMIN_DB" -c "DROP DATABASE IF EXISTS \"${DB_NAME}\""
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_ADMIN_DB" -c "CREATE DATABASE \"${DB_NAME}\""
        print_success "Database reset complete"
        echo "Run 'bun run db:migrate' to recreate schema"
    else
        print_info "Reset cancelled"
    fi
}

status_db() {
    print_header

    if check_container_exists; then
        local status=$(docker inspect -f '{{.State.Status}}' "$DB_CONTAINER")
        local health=$(docker inspect -f '{{.State.Health.Status}}' "$DB_CONTAINER" 2>/dev/null || echo "N/A")

        echo "Container:  $DB_CONTAINER"
        echo "Status:     $status"
        echo "Health:     $health"
        echo "Host:       $DB_HOST"
        echo "Port:       $DB_PORT"
        echo "Database:   $DB_NAME"
        echo ""

        if [ "$status" = "running" ]; then
            print_success "PostgreSQL container is running"
        else
            print_error "PostgreSQL container is not running"
            echo "Start with: docker start $DB_CONTAINER"
        fi
    else
        print_error "PostgreSQL container '$DB_CONTAINER' not found"
        echo "Create/start shared container first, or use fallback: bun run docker:up"
    fi
}

migrate_db() {
    print_header
    echo "Pushing Drizzle schema to database..."
    cd "$PROJECT_ROOT"
    bun run db:push
    print_success "Schema push complete"
}

studio_db() {
    print_header
    echo "Starting Drizzle Studio..."
    cd "$PROJECT_ROOT"
    bun run db:studio
}

show_help() {
    print_header
    echo "Usage: ./scripts/db-setup.sh [command]"
    echo ""
    echo "Default flow uses shared Docker PostgreSQL container '$DB_CONTAINER'."
    echo "Project fallback container stays available through 'bun run docker:up'."
    echo ""
    echo "Commands:"
    echo "  start     Verify container and create project database if needed"
    echo "  stop      Show manual stop guidance for shared container"
    echo "  reset     Drop and recreate only project database"
    echo "  status    Show shared database container status"
    echo "  migrate   Generate and run migrations"
    echo "  studio    Open Drizzle Studio"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./scripts/db-setup.sh start     # Verify shared PostgreSQL + ensure DB exists"
    echo "  ./scripts/db-setup.sh migrate   # Run migrations"
    echo "  ./scripts/db-setup.sh status    # Check container status"
}

# Main script
case "${1:-help}" in
    start)
        start_db
        ;;
    stop)
        stop_db
        ;;
    reset)
        reset_db
        ;;
    status)
        status_db
        ;;
    migrate)
        migrate_db
        ;;
    studio)
        studio_db
        ;;
    help|*)
        show_help
        ;;
esac
