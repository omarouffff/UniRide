#!/bin/sh
set -e

# Prisma schema requires DIRECT_DATABASE_URL; default to DATABASE_URL for direct-only setups
export DIRECT_DATABASE_URL="${DIRECT_DATABASE_URL:-${DIRECT_URL:-$DATABASE_URL}}"

echo "[UniRide] Running Prisma migrations..."
npx prisma migrate deploy

echo "[UniRide] Starting API server on port ${PORT:-5000}..."
exec node server.js
