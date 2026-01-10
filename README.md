# Ledger (v1 scaffold)

Ledger is an internal AI Ops panel for the social media post pipeline: repo -> brief -> drafts -> approvals -> schedule -> reminders. This v1 scaffold is intentionally simple and read-only; it uses mocked data, a thin local API layer, and no external integrations yet. Ledger does not modify repo contents in this version.

## V1 scope
- Read-only internal UI for review workflows: dashboard, inbox, drafts, schedules, tasks, settings
- In-memory storage with seeded data (default)
- Thin API routes for approvals, revisions, and task updates
- Admin token gate for every page and API route

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

## Dev-only seed data
For local dogfooding you can seed realistic workflow data in DB mode:
```bash
STORAGE_MODE=db NODE_ENV=development npm run db:seed
```
This script is idempotent and will not run in production.

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

## Deploying to Railway (web service now, worker later)
- Create a PostgreSQL plugin (future DB mode).
- Set environment variables from `.env.example`.
- Railway will inject `PORT`; Next.js reads it automatically.
- For now, deploy as a web service only. A worker process can be added later.

## Future steps
- GitHub OAuth for repo access
- OpenAI API for draft and schedule generation
- Background worker for scheduling and reminders
- SendGrid emails for notifications
