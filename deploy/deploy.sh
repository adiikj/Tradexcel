#!/usr/bin/env bash
#
# Deploys the backend to the VM: pull, install, migrate, build, restart.
#
# Migrations run before the new code starts, so the schema is never behind
# the code that's talking to it. If the migration fails, the old build keeps
# running and the deploy stops there.
#
# Usage:  ./deploy/deploy.sh
#
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/tradexcel}"
SERVICE="${SERVICE:-tradexcel-api}"

cd "$APP_DIR"

echo "==> Pulling"
git pull --ff-only

echo "==> Installing dependencies"
# --prod=false so prisma and typescript are there for the build.
corepack enable
pnpm install --frozen-lockfile --prod=false

echo "==> Applying migrations"
# The shared package has to be built first: the backend resolves it through
# node_modules -> packages/shared/dist.
pnpm --filter @tradexcel/shared build
pnpm --filter @tradexcel/backend db:deploy

echo "==> Building"
# "@tradexcel/backend..." builds the backend and the packages it depends on.
pnpm --filter "@tradexcel/backend..." build

echo "==> Restarting $SERVICE"
sudo systemctl restart "$SERVICE"
sudo systemctl status "$SERVICE" --no-pager

echo "==> Health check"
# The service answers here once it is listening. Retry briefly: a restart
# takes a moment, and the first request can be slow while the chat model
# loads.
for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${PORT:-8000}/api/v1/finance/quotes?symbols=RELIANCE.NS" >/dev/null 2>&1; then
    echo "==> Up."
    exit 0
  fi
  sleep 2
done

echo "!! The service did not answer in time - check: journalctl -u $SERVICE -n 50" >&2
exit 1
