#!/usr/bin/env bash
set -euo pipefail

export PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}"
export PATH="$PNPM_HOME:$PATH"

if [[ ! -f "$HOME/appstack/env.production" ]]; then
  echo "[deploy] Missing ~/appstack/env.production" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$HOME/appstack/env.production"
set +a

WORKDIR="$HOME/appstack"
REPO_DIR="$WORKDIR/repo"
LOG_DIR="$WORKDIR/logs"

mkdir -p "$WORKDIR" "$LOG_DIR"

if [[ ! -d "$REPO_DIR/.git" ]]; then
  echo "[deploy] Repository missing at $REPO_DIR" >&2
  exit 2
fi

cd "$REPO_DIR"

echo "[deploy] Fetching latest changes"
git fetch --all --prune

echo "[deploy] Checking out ${GIT_BRANCH:-main}"
git checkout "${GIT_BRANCH:-main}"

echo "[deploy] Pulling latest commits"
git pull --rebase

echo "[deploy] Installing workspace dependencies"
pnpm install -w

echo "[deploy] Building workspaces"
pnpm -r build

if [[ -n "${BETTERSTACK_HTTP_CHECK_URL:-}" ]]; then
  export BETTERSTACK_HTTP_CHECK_URL
fi

if [[ -n "${SENTRY_DSN:-}" ]]; then
  export SENTRY_DSN
fi

echo "[deploy] Reloading PM2"
pm2 startOrReload ecosystem.config.cjs
pm2 save

echo "[deploy] PM2 status"
pm2 status

if [[ -n "${BETTERSTACK_HTTP_CHECK_URL:-}" ]]; then
  curl -fsS -X POST -H "Content-Type: application/json" -d '{"ok":true}' "${BETTERSTACK_HTTP_CHECK_URL}" >/dev/null 2>&1 || true
fi

