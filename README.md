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
cp .env.example .env
# Set OPENCLAW_GATEWAY_TOKEN from your OpenClaw config
```

Run:

```bash
npm run dev
```

## Tech

- **Frontend:** Next.js 15 · React 19 · Tailwind CSS v4 · TypeScript
- **Database:** SQLite (better-sqlite3) — `db/cv-tailor.db`
- **AI:** OpenClaw Gateway (talks to your configured agent)
- **Docs:** Google Docs via `gog` CLI

## Database

SQLite database at `db/cv-tailor.db`:

- `cvs` — master CV templates
- `jobs` — job applications with tailored CV links and status tracking
