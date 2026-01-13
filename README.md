# Ledger (v1 scaffold)

Ledger is a human-in-the-loop AI Ops panel for turning repo evidence into approved social posts, without losing human authorship. It is intentionally read-only against source repos, and it never posts without explicit approval records. This repo ships a minimal scaffold that keeps boundaries clear while the workflow matures.

Start here:
- `docs/SYSTEM_OVERVIEW.md` (single source of truth)
- `docs/DEVELOPER_GUIDE.md` (local setup, scripts, DB/migrations)
- `docs/DEPLOYMENT_GUIDE.md` (Railway)

Docs map:
- `docs/SYSTEM_PUBLIC.md`
- `docs/SYSTEM_ADMIN.md`
- `docs/SYSTEM_OPS.md`
- `docs/PAGESPEED_TRADEOFFS.md`
- `docs/COPILOT_INSTRUCTIONS_SUMMARY.md`

## Briefs (DB mode)
Briefs are short, reusable context blocks that feed post generation. They can be created by AI from repo evidence or from pasted text, then reused across multiple posts.

Basic flow:
- Visit `/briefs` to view the list.
- Generate a new brief via AI (manual trigger) from a repo or pasted text.
- Open a brief for details or delete it when it is no longer needed.

## Content Ops (DB mode)
Ledger includes Content Ops for typed content intake with approvals and cadence tracking. This is DB-only in Phase 1.

Supported types (v1):
- Field Notes
- Project Notes
- Systems Memos
- Blog Features
- Change Log
- Decision Records (ADR-lite)
- Signal Log

Input formats:
- Field Notes: bullets (Markdown)
- Project Notes: CSV rows (`case_study_slug,date,metric,detail,source_link`)
- Systems Memo: Markdown outline or JSON (Thesis/Points/Example/Takeaway)
- Blog Feature: Markdown with frontmatter (`title`, `primary_keyword`, etc.)

AI draft workflow (manual, optional):
- Go to `/content/new`, pick a type + style preset.
- Paste base material or upload files (.txt/.md/.csv/.pdf/.docx, 2MB each).
- Click “Generate draft”, then edit before marking READY/APPROVED.
- Approved items can be sent to Scheduler for a suggested plan (no auto-posting).

Commands:
- `npm run prisma:migrate`
- `npm run content:seed`
- `npm run content:smoke`
- `npm run ai:smoke`

Notes:
- No publishing or external writes in this pass.
- No automatic case study updates.
- Content can always be saved as DRAFT with warnings.
- READY/APPROVED status enforces stricter validation gates.
- Optional AI Assist is manual and requires `OPENAI_API_KEY`.
- AI instructions always include global hard rules (see `lib/ai/instructionsCore.ts`).

Manual QA checklist:
- Briefs: list loads, AI generate works (or shows missing API key), delete works.
- Content: Requirements/Paste panels collapsed by default, expand on validation errors.
- Inbox/Posts: actions are labeled clearly and flow is legible.
- Audit: human labels shown, technical codes preserved, raw metadata expandable.
- Dashboard: system overview cards + needs-attention section present.
