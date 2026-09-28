#!/usr/bin/env bash
set -euo pipefail
# Rehearse recovery in a disposable container. Never touches the live database.
backup_dir="$(realpath "${1:?Pass the backup directory}")"
(cd "$backup_dir" && sha256sum -c SHA256SUMS)
tar -tzf "$backup_dir/uploads.tar.gz" >/dev/null
container="transligual-restore-check-$(date +%s)-$$"
cleanup() { docker rm -fv "$container" >/dev/null 2>&1 || true; }
trap cleanup EXIT
password="$(openssl rand -hex 24)"
docker run -d --name "$container" -e POSTGRES_PASSWORD="$password" -e POSTGRES_DB=restore_check postgres:16-alpine >/dev/null
ready=false
for attempt in $(seq 1 30); do
 if docker exec "$container" pg_isready -U postgres -d restore_check >/dev/null 2>&1; then ready=true; break; fi
 sleep 2
done
test "$ready" = true
docker exec -i "$container" pg_restore -U postgres -d restore_check --no-owner --no-acl --exit-on-error < "$backup_dir/database.dump"
docker exec "$container" psql -U postgres -d restore_check -v ON_ERROR_STOP=1 -c 'SELECT COUNT(*) AS accounts FROM "User"; SELECT COUNT(*) AS courses FROM "Course";'
printf 'Database restore and upload archive integrity checks passed.\n'
