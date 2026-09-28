#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077
backup_root="${BACKUP_DIR:-$PWD/backups}"
mkdir -p "$backup_root"
backup_dir="$backup_root/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir "$backup_dir"
compose=(docker compose --env-file .env.production -f docker-compose.production.yml)
# Uploaded files are immutable. Dump the DB before taking the media archive.
"${compose[@]}" exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$backup_dir/database.dump"
"${compose[@]}" exec -T api tar -C /app/uploads -czf - . > "$backup_dir/uploads.tar.gz"
test -s "$backup_dir/database.dump"
tar -tzf "$backup_dir/uploads.tar.gz" >/dev/null
(cd "$backup_dir" && sha256sum database.dump uploads.tar.gz > SHA256SUMS)
printf 'Backup complete: %s\nCopy this directory to private off-host storage.\n' "$backup_dir"
