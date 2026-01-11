# Developer Guide

Local setup (memory mode)
1) `npm install`
2) `cp .env.example .env.local`
3) Set `ADMIN_TOKEN` in `.env.local`
4) `npm run dev`
5) Visit `/login` and enter the token

DB mode
1) Set in `.env.local`:
   - `STORAGE_MODE=db`
   - `DATABASE_URL=postgresql://localhost:5432/ledger?schema=public`
2) Run:
   - `npm run prisma:generate`
   - `npm run prisma:migrate`
3) Optional: `npm run db:smoke`

Prisma migrate diff (shadow DB)
```bash
createdb ledger_shadow
```
Set:
```
SHADOW_DATABASE_URL=postgresql://localhost:5432/ledger_shadow
```
Then:
```bash
npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --script
```

Dev-only seed data (DB mode)
```bash
STORAGE_MODE=db NODE_ENV=development npm run db:seed
```

GitHub App setup (optional, DB mode)
- Configure env vars in `.env.local`.
- Go to `/settings/integrations/github` and install/select repos.
- `npm run github:smoke` skips if not configured or not installed.

AI integration (optional)
- Set `OPENAI_API_KEY` in `.env.local`.
- AI endpoints are manual; no auto-run.

Scripts
- `npm run dev`
- `npm run dev:turbo` (guarded)
- `npm run lint`
- `npm run typecheck`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:status`
- `npm run prisma:validate`
- `npm run db:smoke`
- `npm run db:seed`
- `npm run github:smoke`
