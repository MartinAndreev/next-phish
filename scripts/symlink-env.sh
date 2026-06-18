#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Packages that need the root .env available at their own root
TARGETS=(
  "packages/database"
)

for target in "${TARGETS[@]}"; do
  target_dir="$ROOT_DIR/$target"
  if [ -d "$target_dir" ]; then
    ln -sf ../../.env "$target_dir/.env"
    echo "linked  .env  ->  $target/.env"
  fi
done

echo "done"
