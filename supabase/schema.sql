-- CV Tailor Supabase Schema

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- CV Templates
create table if not exists cvs (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Master CV',
  doc_url text not null,
  parsed_sections jsonb,
  is_preset boolean default false,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table if exists cvs add column if not exists is_preset boolean default false;
alter table if exists cvs add column if not exists display_name text;

-- Job Applications
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid references cvs(id) on delete set null,
  job_url text,
  job_title text not null,
  job_company text,
  job_description text,
  status text default 'draft' check (status in ('draft', 'tailoring', 'done', 'failed')),
  application_status text check (application_status in ('not_applied', 'applied', 'interview', 'offer', 'rejected', 'withdrawn')),
  tailored_cv_url text,
  last_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table if exists jobs add column if not exists application_status text;

create table if not exists revisions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  revision_number integer not null,
  tailored_cv_url text,
  feedback text,
  tailored_sections jsonb,
  created_at timestamptz default now()
);

create table if not exists keyword_analysis (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  revision_id uuid references revisions(id) on delete set null,
  matched_keywords text[] default '{}',
  missed_keywords text[] default '{}',
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_jobs_cv_id on jobs(cv_id);
create index if not exists idx_jobs_status on jobs(status);
create index if not exists idx_jobs_created_at on jobs(created_at desc);
create index if not exists idx_revisions_job_id on revisions(job_id);
create unique index if not exists idx_revisions_job_revision on revisions(job_id, revision_number);
create index if not exists idx_keyword_analysis_job_id on keyword_analysis(job_id);

-- Row Level Security
alter table cvs enable row level security;
alter table jobs enable row level security;
alter table revisions enable row level security;
alter table keyword_analysis enable row level security;

-- Policies (open for now — single user, can tighten later)
create policy "Allow all" on cvs for all using (true) with check (true);
create policy "Allow all" on jobs for all using (true) with check (true);
create policy "Allow all" on revisions for all using (true) with check (true);
create policy "Allow all" on keyword_analysis for all using (true) with check (true);
