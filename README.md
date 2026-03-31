# Just-Job

AI-powered CV tailoring that takes your master Google Docs resume and generates job-specific optimized versions.

**Stack:** Next.js · Supabase · OpenRouter AI · Google Docs API

## How it works

1. **Connect your CV** — paste your Google Docs URL
2. **Add a job** — paste the job URL or description
3. **Generate** — AI rewrites each section for ATS optimization
4. **Output** — new Google Doc in your Drive, ready to apply

## Tech

- **Frontend:** Next.js 15 · React 19 · Tailwind CSS v4 · TypeScript
- **Database:** Supabase (PostgreSQL + Auth)
- **AI:** OpenRouter API
- **Docs:** Google Docs via `gog` CLI

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in Supabase, OpenRouter, and Google Docs credentials
npm run dev
```

## Deployment

### Env Vars (Vercel)

Set these in Vercel project settings:

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase → Project Settings → API |
| `OPENROUTER_API_KEY` | Server-side only |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` |
| `TAILOR_MODEL` | e.g. `openai/gpt-5.4-nano` |

### Database Migrations

After connecting to Supabase, run migrations in `supabase/migrations/` via the Supabase SQL Editor.

### Auth

Users are pre-approved — create accounts manually in Supabase Dashboard → Authentication → Users.
