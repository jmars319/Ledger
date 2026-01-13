# System Overview

Ledger is a human-in-the-loop ops panel for turning repo evidence into approved social posts.

Pipeline
1) Repo allowlist (GitHub App, read-only)
2) Evidence capture (commits/PRs/releases/docs)
3) Briefs (human or AI suggested)
4) Posts (drafts) per platform
5) Content Ops artifacts (Field Notes, Systems Memos, Blog Features)
6) Approval gates
7) Schedules + manual tasks
8) Audit logging

Core boundaries
- Repo is read-only; Ledger never writes to GitHub.
- AI proposes; humans approve (no auto-posting).
- All state transitions are recorded in AuditLog.

Key UI routes
- Dashboard: `/dashboard`
- Inbox: `/inbox`
- Posts: `/posts/new`, `/posts/:id`, `/posts/archive`
- Briefs: `/briefs`
- Schedules: `/schedules`, `/schedules/manage`
- Tasks: `/tasks`, `/tasks/archive`
- Settings: `/settings`, `/settings/integrations/github`

Key code anchors
- Storage switch: `lib/store` (memory/db)
- Prisma schema: `prisma/schema.prisma`
- GitHub integration: `lib/github`, `app/api/github/*`
- AI integration: `lib/ai`, `app/api/ai/*`
- Auth middleware: `middleware.ts` (admin gate)

Related docs
- Admin UX: `docs/SYSTEM_ADMIN.md`
- Ops & runtime: `docs/SYSTEM_OPS.md`
- Developer setup: `docs/DEVELOPER_GUIDE.md`
- Deployment: `docs/DEPLOYMENT_GUIDE.md`

Docs map
- `docs/SYSTEM_PUBLIC.md` — public surface area (if any)
- `docs/SYSTEM_ADMIN.md` — admin workflows, approvals, UI map
- `docs/SYSTEM_OPS.md` — runtime, env vars, guardrails
- `docs/DEPLOYMENT_GUIDE.md` — Railway and prod deployment
- `docs/DEVELOPER_GUIDE.md` — local setup, scripts, DB, Prisma
- `docs/PAGESPEED_TRADEOFFS.md` — performance posture
- `docs/COPILOT_INSTRUCTIONS_SUMMARY.md` — repo rules and constraints
