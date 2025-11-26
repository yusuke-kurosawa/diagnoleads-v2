#!/bin/bash
#
# Database Restore Script for DiagnoLeads
#
# Usage:
#   ./scripts/restore-database.sh <backup_file>
#
# Environment variables:
#   DATABASE_URL - PostgreSQL connection string (required)
#
# WARNING: This script will DROP and recreate the database schema!
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Check required arguments and environment variables
check_requirements() {
  if [ $# -lt 1 ]; then
    log_error "Usage: $0 <backup_file>"
    exit 1
  fi

  BACKUP_FILE="$1"

  if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
  fi

  if [ -z "${DATABASE_URL:-}" ]; then
    log_error "DATABASE_URL environment variable is required"
    exit 1
  fi

  if ! command -v psql &> /dev/null; then
    log_error "psql is not installed"
    exit 1
  fi
}

# Confirm restoration
confirm_restore() {
  echo ""
  log_warn "╔══════════════════════════════════════════════════════════════╗"
  log_warn "║                         WARNING                              ║"
  log_warn "║  This will OVERWRITE the current database with backup data!  ║"
  log_warn "║  All current data will be LOST!                             ║"
  log_warn "╚══════════════════════════════════════════════════════════════╝"
  echo ""
  log_info "Backup file: $BACKUP_FILE"
  log_info "Target database: ${DATABASE_URL%%@*}@***"
  echo ""

  read -p "Are you ABSOLUTELY sure you want to proceed? (type 'yes' to confirm): " confirm

  if [ "$confirm" != "yes" ]; then
    log_info "Restore cancelled by user"
    exit 0
  fi

  # Double confirmation for production
  if [[ "${DATABASE_URL}" == *"prod"* ]] || [[ "${DATABASE_URL}" == *"production"* ]]; then
    log_warn "PRODUCTION DATABASE DETECTED!"
    read -p "Type the word 'PRODUCTION' to confirm: " prod_confirm

    if [ "$prod_confirm" != "PRODUCTION" ]; then
      log_info "Restore cancelled - production confirmation failed"
      exit 0
    fi
  fi
}

# Verify backup file
verify_backup_file() {
  log_info "Verifying backup file integrity..."

  if [[ "$BACKUP_FILE" == *.gz ]]; then
    if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
      log_error "Backup file is corrupted (gzip integrity check failed)"
      exit 1
    fi
  fi

  log_info "Backup file integrity check passed"
}

# Perform the restore
perform_restore() {
  log_info "Starting database restore..."
  log_info "This may take several minutes depending on the backup size..."

  local start_time
  start_time=$(date +%s)

  # Restore based on file type
  if [[ "$BACKUP_FILE" == *.gz ]]; then
    log_info "Decompressing and restoring from gzip archive..."
    if gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL" --quiet 2>&1; then
      local end_time
      end_time=$(date +%s)
      local duration=$((end_time - start_time))
      log_info "Restore completed in ${duration} seconds"
      return 0
    else
      log_error "Restore failed"
      return 1
    fi
  else
    log_info "Restoring from SQL file..."
    if psql "$DATABASE_URL" --quiet < "$BACKUP_FILE" 2>&1; then
      local end_time
      end_time=$(date +%s)
      local duration=$((end_time - start_time))
      log_info "Restore completed in ${duration} seconds"
      return 0
    else
      log_error "Restore failed"
      return 1
    fi
  fi
}

# Verify restored data
verify_restored_data() {
  log_info "Verifying restored data..."

  # Count records in main tables
  local tables=("users" "organizations" "leads")

  for table in "${tables[@]}"; do
    local count
    count=$(psql "$DATABASE_URL" --quiet --tuples-only -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ')

    if [ -n "$count" ]; then
      log_info "  - $table: $count records"
    else
      log_warn "  - $table: could not count records"
    fi
  done
}

# Main execution
main() {
  log_info "=== DiagnoLeads Database Restore ==="

  check_requirements "$@"
  verify_backup_file
  confirm_restore

  if perform_restore; then
    verify_restored_data
    log_info "=== Restore completed successfully ==="
    echo ""
    log_warn "IMPORTANT: Please verify your application is working correctly!"
    log_warn "Run any necessary migrations if the backup is from an older version."
    exit 0
  else
    log_error "=== Restore failed ==="
    exit 1
  fi
}

main "$@"
