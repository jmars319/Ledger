# System Admin

Auth model (v1)
- All pages and API routes require `ADMIN_TOKEN`.
- Accepted tokens:
  - Header: `x-admin-token`
  - Query: `?token=...`
  - Login cookie: `ledger_admin` from `/login`

Primary admin pages
- Dashboard (`/dashboard`): counts + audit tail
- Inbox (`/inbox`): items awaiting review
- Posts (`/posts/*`): review and status updates
- Briefs (`/briefs`): create, list, and manage briefs
- Content (`/content/*`): Content Ops intake and review
- Schedules (`/schedules/*`): review schedule proposals
- Tasks (`/tasks*`): manual posting tasks
- Settings (`/settings`): repo access + integrations

Approval gates
- Post status: NEEDS_REVIEW → APPROVED/REVISION_REQUESTED/REJECTED
- Schedule status: NEEDS_REVIEW → APPROVED/REVISION_REQUESTED/REJECTED
- Task status: PENDING → DONE/SKIPPED

AI usage (manual only)
- Brief suggestions and post generation are invoked by explicit API calls.
- No automatic posting or scheduling.
