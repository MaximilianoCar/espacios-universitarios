#!/bin/sh
set -eu

: "${DB_HOST:?DB_HOST is required}"
: "${DB_PORT:?DB_PORT is required}"
: "${DB_USER:?DB_USER is required}"
: "${DB_PASSWORD:?DB_PASSWORD is required}"
: "${DB_NAME:?DB_NAME is required}"

BACKUP_DIR=${BACKUP_DIR:-/backups}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}
BACKUP_INTERVAL_HOURS=${BACKUP_INTERVAL_HOURS:-24}

INTERVAL_SECONDS=$((BACKUP_INTERVAL_HOURS * 3600))

mkdir -p "$BACKUP_DIR"

echo "Waiting for database ${DB_HOST}:${DB_PORT}..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
  sleep 2
done

echo "Database is ready. Starting backup loop."

while true; do
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

  echo "Creating backup: ${BACKUP_FILE}"
  PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    | gzip > "$BACKUP_FILE"

  echo "Removing backups older than ${BACKUP_RETENTION_DAYS} days"
  find "$BACKUP_DIR" -type f -name "${DB_NAME}_*.sql.gz" -mtime "+${BACKUP_RETENTION_DAYS}" -print -delete || true

  echo "Next backup in ${BACKUP_INTERVAL_HOURS} hour(s)."
  sleep "$INTERVAL_SECONDS"
done
