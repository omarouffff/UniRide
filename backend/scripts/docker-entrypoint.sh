#!/bin/sh
set -e

export DIRECT_DATABASE_URL="${DIRECT_DATABASE_URL:-${DIRECT_URL:-}}"

if [ "${SKIP_MIGRATIONS:-false}" = "true" ]; then
  echo "[UniRide] SKIP_MIGRATIONS=true — skipping prisma migrate deploy"
else
  node /app/scripts/run-migrations.js
fi

echo "[UniRide] Starting API on 0.0.0.0:${PORT:-5000}..."
exec node /app/server.js
