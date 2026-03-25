# CV Tailor — SPEC.md

## Concept & Vision

A precision CV tailoring tool that takes your master resume (Google Docs) and a job listing, then AI-generates a perfectly optimized version for that specific role — same format, sharper content. No more copy-pasting into ChatGPT and manually rebuilding formatting. Drop in a Google Docs link, paste a job URL (or the description), and get back a new Google Doc ready to send.

**Vibe:** Clean, professional, zero friction. The tool feels like a trusted co-pilot who knows how you present yourself and just... makes you look right for the job.

---

## Design Language

- **Aesthetic:** Minimal professional — not corporate-stiff, but clean and confident. Think Linear.app meets Notion.
- **Color Palette:**
  - Background: `#0A0A0A` (near-black)
  - Surface: `#141414` (cards/panels)
  - Border: `#2A2A2A`
  - Primary Accent: `#6366F1` (indigo — professional but not boring)
  - Success: `#22C55E`
  - Error: `#EF4444`
  - Text Primary: `#FAFAFA`
  - Text Secondary: `#A1A1AA`
- **Typography:** Inter (sans-serif), monospace for code/URLs
- **Motion:** Subtle — 200ms ease-out transitions, loading states with smooth progress, no flashy animations

---

## How It Works (User Flow)

1. **Connect CV** — Paste your master Google Docs URL (only needs to happen once, stored in localStorage/session)
2. **Input Job** — Either:
   - Paste a job listing URL → app scrapes the description automatically
   - Paste the job description text directly
3. **Preview & Confirm** — See the original CV sections alongside what the AI plans to change (highlighted diff view)
4. **Generate** — Click "Generate Tailored CV" → AI rewrites each section
5. **Output** — New Google Doc created in the same Drive, same formatting, optimized content. Link shown in UI + optionally copied to clipboard.

---

## Layout & Structure

### Single Page Application — 3-Step Wizard

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] CV Tailor                                     [?]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Your CV          Step 2: Job Listing    Step 3    │
│  ●━━━━━━━━━━━━━━━━━━━━━━━━○━━━━━━━━━━━━━━━━━━━━━○         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  CONTENT AREA (changes per step)                    │    │
│  │                                                      │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│                                    [Back]  [Next →]         │
└─────────────────────────────────────────────────────────────┘
```

### Step 1 — CV Input
- Text input for Google Docs URL
- "Load CV" button → uses `gog docs read <url>` to fetch content
- Once loaded: shows CV preview (collapsible sections)
- "Use this CV" confirmation button

### Step 2 — Job Input
- Toggle: **URL** | **Paste Text**
- **URL mode:** Input field for job listing URL + "Fetch" button
  - Shows scraped content preview
  - Supports: LinkedIn, Indeed, Greenhouse, Lever, Workday
- **Paste mode:** Large textarea for raw job description
- Shows job preview with detected role title highlighted

### Step 3 — Review & Generate
- Side-by-side or accordion view showing:
  - Original CV section
  - AI-proposed changes (highlighted)
- Each section expandable: Experience, Skills, Summary, Education
- "Generate CV" button (prominent, indigo)
- Loading state with step indicators ("Parsing CV... → Analyzing job... → Rewriting... → Creating Doc...")

### Result State
- Success: "Your tailored CV is ready!" + Google Docs link (opens in new tab)
- Actions: "Copy link", "Create another", "Download as PDF" (future)

---

## Technical Approach

### Stack
- **Frontend:** Next.js 16 + React 19 + Tailwind v4 + TypeScript
- **Google Docs:** `gog docs read` (read) + `gog docs create` (write) — already authenticated
- **Job Scraping:** 
  - Cheerio for static pages (Indeed, Greenhouse, Lever)
  - Playwright for dynamic pages (LinkedIn, some Workday)
  - Fallback: show error with "just paste the description" prompt
- **AI Rewriting:** OpenAI (`gpt-4o`) or Anthropic (`claude-3-5-sonnet`) — configurable via `.env`

### API Routes (Next.js)

```
POST /api/cv/parse
  Body: { docUrl: string }
  Response: { sections: CVSection[] }
  Uses: gog docs read

POST /api/job/scrape
  Body: { url: string } | { text: string }
  Response: { title: string, company: string, description: string, source: string }

POST /api/cv/tailor
  Body: { cv: CVSection[], jobDescription: string, jobTitle: string, company: string }
  Response: { tailoredSections: CVSection[] }

POST /api/cv/export
  Body: { sections: CVSection[], originalDocUrl: string }
  Response: { newDocUrl: string }
  Uses: gog docs create (copies format from original, populates new content)
```

### Data Model

```typescript
interface CVSection {
  type: 'summary' | 'experience' | 'skills' | 'education' | 'certifications' | 'other';
  title: string;           // "Work Experience", "Skills", etc.
  content: string;         // Raw text content (bullets preserved as lines)
  originalIndex: number;   // Preserve order from original doc
}

interface JobListing {
  title: string;
  company: string;
  description: string;    // Cleaned text
  source: 'linkedin' | 'indeed' | 'greenhouse' | 'lever' | 'workday' | 'manual';
  url?: string;
}

interface TailoredCV extends CVSection {
  changes: {
    original: string;
    tailored: string;
    changeType: 'reword' | 'add' | 'remove' | 'reorder' | 'keep';
  }[];
}
```

### AI Rewriting Strategy

The tailor endpoint sends to GPT-4o/Claude:

1. **System prompt** — "You are a professional CV writer specializing in ATS optimization..."
2. **User prompt** — Includes:
   - The job description (key requirements, keywords, role)
   - The full CV section
   - Instructions: "Rewrite to highlight relevant skills, reframe achievements toward X requirement, use Y keyword because..."
3. **Response parsing** — Structured JSON with original/tailored pairs per section
4. **No hallucinated content** — Only rewrite what's there, don't invent jobs or skills

### gog Integration

```bash
# Read CV
gog docs read "<google-docs-url>"

# Create new doc (output format matches original)
gog docs create --title "CV — {Role} — {Company}" --content "{tailored_content}"
```

Notes:
- gog outputs markdown, parse into sections
- Creating new doc: use `gog docs create` with formatted content
- Need to handle gog's output format (typically JSON or markdown)

---

## File Structure

```
~/openclaw_projects/cv-tailor/
├── app/
│   ├── page.tsx              # Main wizard
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── cv/
│       │   ├── parse/route.ts
│       │   ├── tailor/route.ts
│       │   └── export/route.ts
│       └── job/
│           └── scrape/route.ts
├── components/
│   ├── StepIndicator.tsx
│   ├── CVInput.tsx
│   ├── JobInput.tsx
│   ├── DiffView.tsx
│   ├── LoadingState.tsx
│   └── ResultCard.tsx
├── lib/
│   ├── gog.ts               # gog CLI wrappers
│   ├── scraper.ts          # Job scraping logic
│   ├── tailor.ts           # AI rewriting logic
│   └── types.ts
├── .env
├── package.json
└── SPEC.md
```

---

## MVP Scope (v1)

- ✅ Single Google account (the one gog is connected to)
- ✅ URL scraping: Indeed + manual paste first, LinkedIn best-effort
- ✅ One CV document at a time (no multi-doc management)
- ✅ Basic section types: summary, experience, skills, education
- ✅ Copy-to-clipboard for the output link
- ✅ Error states: bad URL, scraping failure, AI failure, gog failure

## Future (v2+)

- PDF export
- Multiple CV versions storage
- A/B comparison (two job applications, see which CV is better fit)
- Cover letter generation
- LinkedIn Easy Apply auto-fill
- CV version history

---

## Environment Variables

```
OPENAI_API_KEY=sk-...        # Or use ANTHROPIC_API_KEY
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER=openai           # or 'anthropic'
DEFAULT_MODEL=gpt-4o         # or 'claude-3-5-sonnet'
```
