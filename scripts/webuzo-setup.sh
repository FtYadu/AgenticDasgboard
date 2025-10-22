#!/usr/bin/env bash
set -euo pipefail

REQUIRED_ENV=(
  DOMAIN_ROOT
  SUB_APP
  SUB_API
  SUB_CMS
  GIT_REPO
  GIT_BRANCH
  APP_URL
  API_URL
  CMS_URL
  OPENAI_API_KEY
  VISION_API_KEY
  POSTGRES_URL
  REDIS_HOST
  REDIS_PORT
  STRAPI_ADMIN_EMAIL
  STRAPI_ADMIN_PASS
)

for var in "${REQUIRED_ENV[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "[setup] Missing required env var: $var" >&2
    exit 1
  fi
done

WORKDIR="$HOME/appstack"
REPO_DIR="$WORKDIR/repo"
ENV_FILE="$WORKDIR/env.production"
LOG_DIR="$WORKDIR/logs"

mkdir -p "$WORKDIR" "$LOG_DIR"

echo "[setup] Ensuring pnpm and pm2 are installed"
node -v || true
curl -fsSL https://get.pnpm.io/install.sh | sh - || true
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"
pnpm -v
npm i -g pm2 >/dev/null 2>&1 || true
pm2 update

if ! pm2 list | grep -q pm2-logrotate; then
  pm2 install pm2-logrotate || true
fi
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 10
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss

if [[ ! -d "$REPO_DIR" ]]; then
  echo "[setup] Cloning repository into $REPO_DIR"
  git clone --depth 1 -b "$GIT_BRANCH" "$GIT_REPO" "$REPO_DIR"
else
  echo "[setup] Repository already exists, fetching latest"
  git -C "$REPO_DIR" fetch --all --prune
fi

echo "[setup] Verifying expected workspace layout"
for dir in apps/web apps/orchestrator apps/cms packages/sdk; do
  if [[ ! -d "$REPO_DIR/$dir" ]]; then
    echo "[setup] Expected directory '$dir' missing in repo" >&2
    exit 2
  fi
done

cat > "$ENV_FILE" <<ENV
DOMAIN_ROOT=${DOMAIN_ROOT}
GIT_BRANCH=${GIT_BRANCH}
APP_URL=${APP_URL}
API_URL=${API_URL}
CMS_URL=${CMS_URL}
OPENAI_API_KEY=${OPENAI_API_KEY}
VISION_API_KEY=${VISION_API_KEY}
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=${REDIS_PORT}
REDIS_PASSWORD=${REDIS_PASSWORD:-}
SENTRY_DSN=${SENTRY_DSN:-}
BETTERSTACK_HTTP_CHECK_URL=${BETTERSTACK_HTTP_CHECK_URL:-}
POSTGRES_URL=${POSTGRES_URL}
STRAPI_ADMIN_EMAIL=${STRAPI_ADMIN_EMAIL}
STRAPI_ADMIN_PASS=${STRAPI_ADMIN_PASS}
R2_ENDPOINT=${R2_ENDPOINT:-}
R2_BUCKET=${R2_BUCKET:-}
R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID:-}
R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY:-}
ENV

chmod 600 "$ENV_FILE"

echo "[setup] Syncing deploy script"
install -m 755 "$REPO_DIR/scripts/deploy.sh" "$WORKDIR/deploy.sh"

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ ! -d "$REPO_DIR/.git" ]]; then
  echo "[setup] Repo directory missing .git" >&2
  exit 3
fi

echo "[setup] Running initial deployment"
GIT_BRANCH="$GIT_BRANCH" "$WORKDIR/deploy.sh"

echo "[setup] Performing health checks"
if ! curl -fsS "$API_URL/healthz" | grep -q '"ok":'; then
  echo "[setup] API health check failed" >&2
  exit 4
fi

if ! curl -fsSI "$APP_URL" >/dev/null; then
  echo "[setup] Web app head request failed" >&2
  exit 5
fi

if ! curl -fsSI "$CMS_URL/admin" >/dev/null; then
  echo "[setup] Strapi admin head request failed" >&2
  exit 6
fi

echo "[setup] PM2 process table"
pm2 status

echo "[setup] Logs available under $LOG_DIR"

echo "[setup] Bootstrap Strapi admin if needed"
if [[ -f "$REPO_DIR/apps/cms/scripts/bootstrap-admin.js" ]]; then
  STRAPI_ADMIN_EMAIL="$STRAPI_ADMIN_EMAIL" \
  STRAPI_ADMIN_PASSWORD="$STRAPI_ADMIN_PASS" \
  CMS_URL="$CMS_URL" \
  node "$REPO_DIR/apps/cms/scripts/bootstrap-admin.js" || true
else
  echo "[setup] bootstrap-admin.js not found; create admin via CMS UI." >&2
fi

echo "[setup] All done. Ensure DNS A records for ${SUB_APP}.${DOMAIN_ROOT}, ${SUB_API}.${DOMAIN_ROOT}, and ${SUB_CMS}.${DOMAIN_ROOT} point to this server."
