#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Packages that need the root .env available at their own root
TARGETS=(
  "apps/next-app"
  "apps/static-server"
  "apps/worker"
  "packages/database"
)

for target in "${TARGETS[@]}"; do
  target_dir="$ROOT_DIR/$target"
  if [ -d "$target_dir" ]; then
    if [ -e "$target_dir/.env" ] && [ ! -L "$target_dir/.env" ]; then
      echo "kept existing $target/.env (not a symlink)"
      continue
    fi
    ln -sf ../../.env "$target_dir/.env"
    echo "linked  .env  ->  $target/.env"
  fi
done

echo "done"
