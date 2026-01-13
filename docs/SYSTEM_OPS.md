# System Ops

Runtime modes
- Default: `STORAGE_MODE=memory` (no DB)
- DB mode: `STORAGE_MODE=db` + `DATABASE_URL`
- Content Ops is DB-only in Phase 1.

Required env var names
- `ADMIN_TOKEN`
- `STORAGE_MODE`
- `DATABASE_URL`
- `APP_BASE_URL`
- `PORT`
- GitHub App (optional): `GITHUB_APP_ID`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_PRIVATE_KEY_PEM`, `GITHUB_APP_SLUG`
- OpenAI (optional): `OPENAI_API_KEY`

Operational guardrails
- GitHub access is read-only and installation-token based.
- Only selected repos are in scope.
- AuditLog records all state transitions.

Logging/monitoring
- Prisma logs warnings/errors in DB mode.
- AuditLog is the primary operational ledger.

Backups
- Back up the Postgres DB before schema changes or data migrations.
