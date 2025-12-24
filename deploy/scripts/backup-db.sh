#!/bin/bash
# =============================================================================
# Database Backup Script
# Run this regularly to backup your MySQL database
# =============================================================================

set -e

# Configuration
BACKUP_DIR="/opt/teachtrack/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="teachtrack_backup_$DATE.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Load environment variables
source /opt/teachtrack/.env

echo "Starting database backup..."

# Create backup using docker
docker exec teachtrack_db mysqldump \
    -u root \
    -p"$DB_ROOT_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    teachtrack | gzip > "$BACKUP_DIR/$BACKUP_FILE"

echo "Backup created: $BACKUP_DIR/$BACKUP_FILE"

# Remove backups older than 7 days
find $BACKUP_DIR -name "teachtrack_backup_*.sql.gz" -mtime +7 -delete

echo "Old backups cleaned up. Keeping last 7 days."

# Show backup size
ls -lh "$BACKUP_DIR/$BACKUP_FILE"
