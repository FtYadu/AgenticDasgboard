# Agentic Dashboard Monorepo

A production-oriented monorepo that combines a Next.js control center, an Express orchestrator, and a Strapi CMS for managing AI agents. The repository is organised for pnpm workspaces and includes an automated deployment script tailored for Webuzo + PM2 hosting.

## Project structure

```
.
├── apps
│   ├── cms            # Strapi CMS (headless content + operator notes)
│   ├── orchestrator   # Node/Express orchestrator API
│   └── web            # Next.js dashboard
├── packages
│   └── sdk            # Shared types/utilities
├── scripts
│   ├── deploy.sh        # Idempotent build + PM2 reload (copied to ~/appstack/deploy.sh)
│   └── webuzo-setup.sh  # One-time Webuzo bootstrap + health checks
├── ecosystem.config.cjs
├── package.json
└── pnpm-workspace.yaml
```

## Requirements

- Node.js 18+
- pnpm 8+
- Upstash (or compatible) Redis endpoint
- PostgreSQL database for Strapi
- API keys for OpenAI and any additional model providers

## Installing dependencies

```bash
pnpm install -w
```

Each workspace contains its own scripts:

- `apps/web` – `pnpm --dir apps/web dev`
- `apps/orchestrator` – `pnpm --dir apps/orchestrator dev`
- `apps/cms` – `pnpm --dir apps/cms develop`

## Environment variables

### Orchestrator (`apps/orchestrator/.env`)

```
PORT=4000
OPENAI_API_KEY=sk-...
VISION_API_KEY=...
CMS_URL=https://cms.example.com
CMS_TOKEN=strapi-server-token
REDIS_HOST=your-upstash-host
REDIS_PORT=your-upstash-port
REDIS_PASSWORD=optional-password
CORS_ORIGINS=https://app.example.com,https://api.example.com
```

### Web (`apps/web/.env.local`)

```
NEXT_PUBLIC_API_BASE=https://api.example.com
NEXT_PUBLIC_WS_BASE=https://api.example.com
```

### CMS (`apps/cms/.env`)

Strapi reads configuration from the environment at runtime (see `ecosystem.config.cjs`). Set at least:

```
POSTGRES_URL=postgresql://user:pass@host:5432/db
STRAPI_ADMIN_EMAIL=...
STRAPI_ADMIN_PASS=...
```

## Local development

### Orchestrator

```bash
cd apps/orchestrator
pnpm install
pnpm dev
```

The orchestrator exposes:

- `GET /healthz` – Redis and Strapi health summary
- `GET /api/snapshot` – Agent, task, and log snapshot
- `POST /api/command` – Queue a command (also enqueued in Redis)
- `POST /api/messages` – Persist operator notes to Strapi
- `GET /api/logs/stream` – Server-sent events stream of log entries

### Web dashboard

```bash
cd apps/web
pnpm install
pnpm dev
```

The dashboard consumes the orchestrator API and listens to the SSE stream for live logs.

### CMS (Strapi)

```bash
cd apps/cms
pnpm install
pnpm develop
```

Configure the PostgreSQL connection via environment variables. Bootstrap the admin user once Strapi is running:

```bash
STRAPI_ADMIN_EMAIL=you@example.com STRAPI_ADMIN_PASSWORD=strongpass node scripts/bootstrap-admin.js
```

## Production hardening & deployment on Webuzo

### One-time server bootstrap

Run `scripts/webuzo-setup.sh` on your Webuzo server with the environment variables listed at the top of the script. The helper:

1. Installs pnpm, PM2, pm2-logrotate, and configures sensible log retention (`~/appstack/logs`).
2. Clones/updates the repository in `~/appstack/repo` without deleting existing data.
3. Writes `~/appstack/env.production` with your secrets and service URLs.
4. Copies `scripts/deploy.sh` into `~/appstack/deploy.sh` (executable) and executes it for an initial build.
5. Performs non-interactive health checks against the web, API, and CMS endpoints.

Logs are rotated automatically (10 files × 10 MB, gzip compressed). Re-run the script any time to reconcile dependencies or secrets—it is idempotent.

### Repeatable deployments

`scripts/deploy.sh` is the single entry-point for production releases. It:

- Loads `~/appstack/env.production`.
- Performs `git fetch`/`pull`, `pnpm install -w`, and `pnpm -r build`.
- Calls `pm2 startOrReload ecosystem.config.cjs` and persists the process list.
- Optionally pings Better Stack via `BETTERSTACK_HTTP_CHECK_URL`.

The deploy script is consumed by CI (see below) and can be triggered manually over SSH.

### Nginx reverse proxy snippets

Configure the Webuzo Nginx editor for each subdomain to enable HTTP/2, gzip (where compatible), and SSE support:

**`app.${DOMAIN_ROOT}` → Next.js @ 3000**

```nginx
location ^~ /_next/static/ {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  expires 7d;
  add_header Cache-Control "public, max-age=604800, immutable";
}
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-For $remote_addr;
  proxy_read_timeout 300;
  gzip on;
}
```

**`api.${DOMAIN_ROOT}` → Express @ 4000 (SSE safe)**

```nginx
location / {
  proxy_pass http://127.0.0.1:4000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-For $remote_addr;
  proxy_read_timeout 3600;
  proxy_buffering off;
  gzip off;
}
```

**`cms.${DOMAIN_ROOT}` → Strapi @ 1337**

```nginx
location / {
  proxy_pass http://127.0.0.1:1337;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-For $remote_addr;
  proxy_read_timeout 300;
  gzip on;
}
```

Reload Nginx after saving each snippet and secure all subdomains with Let’s Encrypt via Webuzo.

### Continuous deployment via GitHub Actions

`.github/workflows/deploy.yml` uses an SSH key stored in repository secrets (`SSH_KEY_B64`, `SSH_HOST`, `SSH_USER`, `SSH_PORT`) to call `~/appstack/deploy.sh` on every push to `main`. The job is non-interactive and cleans up the temporary key material.

### Smoke tests & health checks

- Run `pnpm smoke` locally or in CI to execute Playwright-based smoke tests (`tests/smoke.spec.ts`). The tests require `APP_URL`, `API_URL`, and `CMS_URL` environment variables.
- Production health checks also surface at `GET ${API_URL}/healthz`, `HEAD ${APP_URL}`, and `HEAD ${CMS_URL}/admin`.

### Optional observability & media storage

- Set `SENTRY_DSN` to expose the DSN to the orchestrator processes for custom instrumentation.
- Provide `BETTERSTACK_HTTP_CHECK_URL` to receive deployment success pings from `deploy.sh`.
- To use Cloudflare R2 for Strapi uploads, configure `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY`; the Strapi upload plugin will activate automatically.

## License

MIT
