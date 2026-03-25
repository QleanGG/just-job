-- CV Tailor Database Schema

CREATE TABLE IF NOT EXISTS cvs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Master CV',
  doc_url TEXT NOT NULL,
  parsed_sections TEXT,  -- JSON string
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  cv_id TEXT REFERENCES cvs(id),
  job_url TEXT,
  job_title TEXT NOT NULL,
  job_company TEXT,
  job_description TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'tailoring', 'done')),
  tailored_cv_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_cv_id ON jobs(cv_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
