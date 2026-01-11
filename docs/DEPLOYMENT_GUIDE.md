# Deployment Guide

Railway (web service)
1) Create a PostgreSQL plugin.
2) Set env vars from `.env.example`.
3) Ensure `PORT` is set (Railway injects this).
4) Deploy the web service only (worker later).

DB mode in production
- `STORAGE_MODE=db`
- `DATABASE_URL` points at Railway Postgres
- Run migrations with `npm run prisma:migrate`

GitHub App (optional)
- Use the same GitHub App env vars as local dev.
- Install the app and select repos via `/settings/integrations/github`.
