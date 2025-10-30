#!/usr/bin/env bash
set -euo pipefail

echo "Discarding generated bundles…"
git checkout -- index-*.js index-*.css index.html || true

echo "Resetting any other stray changes…"
git reset --hard HEAD

echo "Pulling latest main…"
git pull --ff-only origin main
