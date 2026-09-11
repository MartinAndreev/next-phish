#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "Starting services (PostgreSQL, Redis, Mailpit)..."
docker compose -f "$ROOT_DIR/docker-compose.yml" up -d postgres redis fakesmtp

echo "Setting up environment..."
bash "$ROOT_DIR/scripts/symlink-env.sh"

echo "Starting dev server..."
exec pnpm dev
