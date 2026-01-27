#!/bin/bash
#
# Database Backup Script for DiagnoLeads
#
# Usage:
#   ./scripts/backup-database.sh [output_dir]
#
# Environment variables:
#   DATABASE_URL - PostgreSQL connection string (required)
#   BACKUP_RETENTION_DAYS - Number of days to keep backups (default: 30)
#   SLACK_WEBHOOK_URL - Slack webhook for notifications (optional)
#

set -euo pipefail

# Configuration
BACKUP_DIR="${1:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/diagnoleads_$DATE.sql.gz"

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

# Check required environment variables
check_requirements() {
  if [ -z "${DATABASE_URL:-}" ]; then
    log_error "DATABASE_URL environment variable is required"
    exit 1
  fi

  if ! command -v pg_dump &> /dev/null; then
    log_error "pg_dump is not installed"
    exit 1
  fi
}

# Create backup directory if it doesn't exist
create_backup_dir() {
  if [ ! -d "$BACKUP_DIR" ]; then
    log_info "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
  fi
}

# Perform the backup
perform_backup() {
  log_info "Starting database backup..."
  log_info "Output file: $BACKUP_FILE"

  # Create backup with compression
  if pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > "$BACKUP_FILE"; then
    BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    log_info "Backup completed successfully"
    log_info "Backup size: $BACKUP_SIZE"
    return 0
  else
    log_error "Backup failed"
    return 1
  fi
}

# Clean up old backups
cleanup_old_backups() {
  log_info "Cleaning up backups older than $RETENTION_DAYS days..."

  local deleted_count
  deleted_count=$(find "$BACKUP_DIR" -name "diagnoleads_*.sql.gz" -mtime +$RETENTION_DAYS -print -delete | wc -l)

  if [ "$deleted_count" -gt 0 ]; then
    log_info "Deleted $deleted_count old backup(s)"
  else
    log_info "No old backups to delete"
  fi
}

# Send notification (optional)
send_notification() {
  local status=$1
  local message=$2

  if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
    local color="good"
    if [ "$status" = "error" ]; then
      color="danger"
    fi

    curl -s -X POST "$SLACK_WEBHOOK_URL" \
      -H 'Content-type: application/json' \
      -d "{
        \"attachments\": [{
          \"color\": \"$color\",
          \"title\": \"DiagnoLeads Database Backup\",
          \"text\": \"$message\",
          \"ts\": $(date +%s)
        }]
      }" > /dev/null
  fi
}

# Verify backup integrity
verify_backup() {
  log_info "Verifying backup integrity..."

  if gzip -t "$BACKUP_FILE" 2>/dev/null; then
    log_info "Backup integrity check passed"
    return 0
  else
    log_error "Backup integrity check failed"
    return 1
  fi
}

# Main execution
main() {
  log_info "=== DiagnoLeads Database Backup ==="

  check_requirements
  create_backup_dir

  if perform_backup; then
    if verify_backup; then
      cleanup_old_backups
      send_notification "success" "Database backup completed successfully. Size: $(ls -lh "$BACKUP_FILE" | awk '{print $5}')"
      log_info "=== Backup completed successfully ==="
      exit 0
    else
      send_notification "error" "Backup created but integrity check failed"
      exit 1
    fi
  else
    send_notification "error" "Database backup failed"
    exit 1
  fi
}

main "$@"
