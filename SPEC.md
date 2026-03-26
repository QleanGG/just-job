# CV Tailor — "Just a Job" — SPEC.md

## Concept & Vision

A precision CV tailoring tool that takes your master resume (Google Docs) and a job listing, then AI-generates perfectly optimized versions — same format, sharper content. Built for real iterative use: generate, review, request changes, regenerate. No copy-paste cycles.

**Core loop:** Tailor → Review → Request Changes → Re-tailor → Done

---

## Design Language

- **Aesthetic:** Minimal professional dark theme. Linear.app meets Notion. No decorative elements.
- **Colors:** Zinc-based palette — Background `#09090B`, Surface `#18181B`, Border `#27272A`, Accent `#6366F1`, Text `#FAFAFA`/`#A1A1AA`
- **Motion:** 200ms ease-out, no flashy animations

---

## User Flow

### 5-Step Process

1. **Select CV** — Pick from saved presets or load a new Google Docs URL
2. **Add Job** — URL scrape or paste with title/company/description
3. **Review Changes** — Accordion view of original vs AI-proposed changes per section
4. **Generate + Revise** — Create the doc, then request revisions with feedback
5. **Done** — Link to Google Doc, can revert to any previous version

### Revision Loop

After initial generation:
- Feedback box appears below the diff view
- User types what to change: "make my experience bullets more impact-focused", "remove the certification section", "use more technical language"
- AI re-tails based on feedback — keeps Guy's edits if any were made to the diff
- History stores each revision as a version; user can pick which one to export

---

## Features

### CV Management
- [x] Save CV as preset (named, stored in Supabase)
- [x] Multiple saved CVs with "set as active" toggle
- [x] Auto-load preset on return visit
- [x] CV URL + parsed sections cached in Supabase

### Job Input
- [x] URL scrape (LinkedIn, Indeed, Greenhouse, Lever, Workday)
- [x] Manual paste: Job Title + Company + Description fields
- [x] Job saved to history on creation

### AI Tailoring
- [x] Section-by-section rewrite via OpenClaw Gateway → Crash
- [x] Keyword matching against job description
- [ ] **NEW:** Keyword Gap Analysis — show matched vs missed keywords post-generation
- [x] Status tracking: draft → tailoring → done/failed

### Revision System
- [ ] **NEW:** Feedback box after generation
- [ ] **NEW:** Re-tailor loop — user feedback fed back to AI, new doc created
- [ ] **NEW:** Revision history stored per job in Supabase
- [ ] **NEW:** View/choose between revision versions

### History & Nav
- [x] Tabbed nav: New | My CVs | History
- [x] Job history with status badges + "View CV" links
- [ ] **NEW:** "Re-tailor" button on history items — loads job back into editor
- [ ] **NEW:** Revision count badge on history items

### Export
- [x] Google Docs creation (format-preserving: copy original + replaceAllText)
- [x] Each revision creates a new Google Doc version
- [ ] PDF export via Google Docs download

---

## Tech Stack

- **Frontend:** Next.js 15 + React 19 + Tailwind CSS v4 + TypeScript
- **Database:** Supabase (`eunfgjrpnwgkatvzjgwr.supabase.co`)
- **AI:** OpenClaw Gateway → `openclaw:main` (Crash/me)
- **Google:** gog CLI for Docs/Drive API + Google Docs API for batchUpdate/findReplace
- **Auth:** Single-user, no login

---

## Database Schema

### `cvs`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | Display name |
| doc_url | text | Google Docs URL |
| parsed_sections | jsonb | Cached parsed content |
| is_preset | boolean | Active CV flag |
| display_name | text | User-friendly name |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `jobs`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| cv_id | uuid | FK → cvs |
| job_url | text | |
| job_title | text | |
| job_company | text | |
| job_description | text | |
| status | text | draft/tailoring/done/failed |
| tailored_cv_url | text | Latest version URL |
| last_error | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `revisions` (NEW)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| job_id | uuid | FK → jobs |
| revision_number | int | 1, 2, 3... |
| tailored_cv_url | text | Google Docs URL for this revision |
| feedback | text | User's revision request |
| tailored_sections | jsonb | Full tailored sections for this revision |
| created_at | timestamptz | |

### `keyword_analysis` (NEW)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| job_id | uuid | FK → jobs |
| revision_id | uuid | FK → revisions |
| matched_keywords | text[] | Keywords found in both |
| missed_keywords | text[] | Keywords in job but not in CV |
| created_at | timestamptz | |

---

## API Routes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | /api/cv | List/save CVs |
| GET | /api/cv/presets | Get active preset |
| POST | /api/cv/parse | Load + parse Google Docs |
| POST | /api/cv/tailor | AI tailor sections |
| POST | /api/cv/export | Create Google Doc |
| POST | /api/cv/revision | Save revision + get new tailored version |
| GET | /api/jobs | List jobs |
| POST | /api/jobs | Create job |
| GET/PATCH/DELETE | /api/jobs/[id] | Single job CRUD |
| POST | /api/job/scrape | Scrape job from URL |
| GET | /api/jobs/[id]/revisions | Get revisions for a job |
| GET | /api/jobs/[id]/analysis | Get keyword analysis for a job |
