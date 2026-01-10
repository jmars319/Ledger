# Ledger (v1 scaffold)

Ledger is an internal AI Ops panel for the social media post pipeline: repo -> brief -> drafts -> approvals -> schedule -> reminders. This v1 scaffold is intentionally simple and read-only; it uses mocked data, a thin local API layer, and optional GitHub App integration. Ledger does not modify repo contents in this version.

## V1 scope
- Read-only internal UI for review workflows: dashboard, inbox, drafts, schedules, tasks, settings
- In-memory storage with seeded data (default)
- Thin API routes for approvals, revisions, and task updates
- Admin token gate for every page and API route
- Optional GitHub App integration (read-only, installation-based)

## Local development (mock mode)
1) Install deps:
   ```bash
   npm install
   ```
2) Create a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
3) Set `ADMIN_TOKEN` in `.env.local`.
4) Start dev server:
   ```bash
   npm run dev
   ```
5) Visit `http://localhost:3000/login`, enter the token once, then browse normally.
6) To end the session, visit `http://localhost:3000/logout`.

Optional: for scripted requests you can still send `x-admin-token: YOUR_TOKEN`.

Mock mode is the default (`STORAGE_MODE=memory`). No database is required.

## Admin token middleware
All pages and API routes require `ADMIN_TOKEN` and will accept:
- Header: `x-admin-token`
- Query param: `?token=...`
- Login cookie: `ledger_admin` set via `/login`

This is a placeholder and easy to replace later.

## DB mode (optional)
The Prisma schema is included, but DB mode is off by default. Prisma 7 uses a `prisma.config.ts` file to load the connection URL instead of `schema.prisma`. The config loads `.env` and `.env.local` so the CLI can find `DATABASE_URL`.

1) Set:
   ```bash
   STORAGE_MODE=db
   DATABASE_URL=postgresql://...
   ```
   - Local Postgres.app example: `postgresql://localhost:5432/ledger?schema=public`
2) Run:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```
3) (Optional) Smoke check DB connectivity:
   ```bash
   npm run db:smoke
   ```
4) Start the app as usual.

## Prisma migrate diff (shadow DB)
Prisma 7 requires a shadow database URL for diff-from-migrations.
```bash
createdb ledger_shadow
```
Set:
```
SHADOW_DATABASE_URL=postgresql://localhost:5432/ledger_shadow
```
Then run:
```bash
npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --script
```

## Dev-only seed data
For local dogfooding you can seed realistic workflow data in DB mode:
```bash
STORAGE_MODE=db NODE_ENV=development npm run db:seed
```
This script is idempotent and will not run in production.

## GitHub App integration (optional)
Ledger supports a read-only GitHub App connection in DB mode. The app uses installation tokens only; no user PATs are stored.

Required env vars (set in `.env.local`):
```
GITHUB_APP_ID=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_PRIVATE_KEY_PEM=
GITHUB_APP_SLUG=
```

To connect:
1) Ensure `STORAGE_MODE=db` and `DATABASE_URL` are set.
2) Visit `http://localhost:3000/settings/integrations/github`.
3) Click "Connect GitHub" to install the app.
4) After install, select repos and save the selection.

Only selected repos are considered authorized.

Optional smoke check (skips if not configured):
```bash
npm run github:smoke
```

## GitHub App env setup
- App URL: use the last segment after `/apps/` as the slug.
  - Example URL: `https://github.com/apps/ledger-read-only`
  - Slug: `ledger-read-only`
- Local dev: put secrets in `.env.local` (never commit it).
- Railway: set the same vars in the service environment.

Recommended PEM formatting (single-line, escaped newlines):
```
GITHUB_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Raw multi-line PEM also works if your shell/env loader preserves newlines.

`npm run github:smoke` behavior:
- SKIP if env vars are missing
- SKIP if env vars exist but no installation is connected
- OK if installation token can be generated

## AI integration (optional)
Ledger can generate drafts manually using OpenAI. This is pay-as-you-go and requires `OPENAI_API_KEY`.
- Local dev: set `OPENAI_API_KEY` in `.env.local`.
- Production: set it in Railway env vars.
- Drafts are created only via explicit API calls and remain human-reviewed.

## Scripts
- `npm run dev`
- `npm run dev:turbo` (guarded; only if Turbopack root is safe)
- `npm run lint`
- `npm run typecheck`
- `npm run prisma:generate`
- `npm run prisma:migrate` (requires `DATABASE_URL` and `STORAGE_MODE=db`)
- `npm run prisma:status`
- `npm run prisma:validate`
- `npm run db:smoke` (read-only DB connectivity check)
- `npm run db:seed` (dev-only seed data; requires `STORAGE_MODE=db`)
- `npm run github:smoke` (dev-only GitHub app check; skips if not configured)

## Deploying to Railway (web service now, worker later)
- Create a PostgreSQL plugin (future DB mode).
- Set environment variables from `.env.example`.
- Railway will inject `PORT`; Next.js reads it automatically.
- For now, deploy as a web service only. A worker process can be added later.

## Future steps
- Expand GitHub App ingestion endpoints (commits/releases/PRs) if needed
- OpenAI API for draft and schedule generation
- Background worker for scheduling and reminders
- SendGrid emails for notifications
