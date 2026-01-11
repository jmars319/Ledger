# Copilot Instructions Summary

Repository expectations
- Keep code explicit and minimal; avoid refactors without need.
- Preserve read-only GitHub access and admin-gated actions.
- No automated posting; approvals are mandatory.
- Use Prisma migrations; never delete or rewrite existing migrations.

Auth boundary
- Admin token gate applies to all pages and APIs.
- Cookies are httpOnly; do not store tokens in cookies.

AI boundary
- AI only runs via explicit API calls.
- Posts/briefs must remain human-reviewable.

Deprecated notes
- None at this time. If legacy docs are removed, add a note here with the replacement location.
