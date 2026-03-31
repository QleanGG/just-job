# Just a Job — CV Tailor

AI-powered CV tailoring that takes your master Google Docs resume and generates job-specific optimized versions.

**Stack:** Next.js · SQLite · OpenClaw Agent · Google Docs API

## How it works

1. **Connect your CV** — paste your Google Docs URL
2. **Add a job** — paste the job URL or description
3. **Generate** — AI rewrites each section for ATS optimization
4. **Output** — new Google Doc in your Drive, ready to apply

## Setup

```bash
npm install
```

Configure your environment:

```bash
cp .env.example .env.local
# Fill in Supabase, OpenRouter, and Google Docs credentials
```

Run:

```bash
npm run dev
```

## Deployment access control

This app is intended to be deployed behind two layers of protection:

1. Create approved users in Supabase Auth and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and in the deployment environment.
2. Keep `.env.local` private. It is already gitignored and must not be committed.
3. Set the other required deployment variables in Vercel: `OPENROUTER_API_KEY`, optional `OPENROUTER_BASE_URL`, optional `TAILOR_MODEL`, plus any Google Docs credentials you use.
4. Enable Vercel Access Control as a second gate in project settings.

After deployment, every route is gated by `middleware.ts`. Unauthenticated requests are redirected to `/login`, and successful login stores the Supabase auth session in cookies that middleware validates on each request.

## Tech

- **Frontend:** Next.js 15 · React 19 · Tailwind CSS v4 · TypeScript
- **Database:** SQLite (better-sqlite3) — `db/cv-tailor.db`
- **AI:** OpenClaw Gateway (talks to your configured agent)
- **Docs:** Google Docs via `gog` CLI

## Database

SQLite database at `db/cv-tailor.db`:

- `cvs` — master CV templates
- `jobs` — job applications with tailored CV links and status tracking
