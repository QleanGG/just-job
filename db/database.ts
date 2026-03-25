import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname);
const DB_PATH = path.join(DB_DIR, "cv-tailor.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  const schema = fs.readFileSync(path.join(DB_DIR, "schema.sql"), "utf-8");
  db!.exec(schema);
}

// Types
export interface CV {
  id: string;
  name: string;
  doc_url: string;
  parsed_sections: string | null; // JSON string
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  cv_id: string | null;
  job_url: string | null;
  job_title: string;
  job_company: string | null;
  job_description: string | null;
  status: "draft" | "tailoring" | "done";
  tailored_cv_url: string | null;
  created_at: string;
  updated_at: string;
}

// CV Queries
export function getCvs(): CV[] {
  const db = getDb();
  return db.prepare("SELECT * FROM cvs ORDER BY updated_at DESC").all() as CV[];
}

export function getCvById(id: string): CV | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM cvs WHERE id = ?").get(id) as CV | undefined;
}

export function getLatestCv(): CV | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM cvs ORDER BY updated_at DESC LIMIT 1").get() as CV | undefined;
}

export function upsertCv(id: string, name: string, docUrl: string, parsedSections: object): CV {
  const db = getDb();
  const sectionsJson = JSON.stringify(parsedSections);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO cvs (id, name, doc_url, parsed_sections, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      doc_url = excluded.doc_url,
      parsed_sections = excluded.parsed_sections,
      updated_at = excluded.updated_at
  `).run(id, name, docUrl, sectionsJson, now);

  return getCvById(id)!;
}

// Job Queries
export function getJobs(limit = 50): Job[] {
  const db = getDb();
  return db.prepare("SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?").all(limit) as Job[];
}

export function getJobById(id: string): Job | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM jobs WHERE id = ?").get(id) as Job | undefined;
}

export function getJobsByCvId(cvId: string): Job[] {
  const db = getDb();
  return db.prepare("SELECT * FROM jobs WHERE cv_id = ? ORDER BY created_at DESC").all(cvId) as Job[];
}

export function createJob(data: {
  id: string;
  cvId?: string;
  jobUrl?: string;
  jobTitle: string;
  jobCompany?: string;
  jobDescription?: string;
  status?: "draft" | "tailoring" | "done";
}): Job {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO jobs (id, cv_id, job_url, job_title, job_company, job_description, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.id,
    data.cvId || null,
    data.jobUrl || null,
    data.jobTitle,
    data.jobCompany || null,
    data.jobDescription || null,
    data.status || "draft",
    now,
    now
  );

  return getJobById(data.id)!;
}

export function updateJob(id: string, data: Partial<{
  status: "draft" | "tailoring" | "done";
  tailoredCvUrl: string;
  jobDescription: string;
}>): Job | undefined {
  const db = getDb();
  const now = new Date().toISOString();

  const updates: string[] = ["updated_at = ?"];
  const values: (string | null)[] = [now];

  if (data.status !== undefined) {
    updates.push("status = ?");
    values.push(data.status);
  }
  if (data.tailoredCvUrl !== undefined) {
    updates.push("tailored_cv_url = ?");
    values.push(data.tailoredCvUrl);
  }
  if (data.jobDescription !== undefined) {
    updates.push("job_description = ?");
    values.push(data.jobDescription);
  }

  values.push(id);

  db.prepare(`UPDATE jobs SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  return getJobById(id);
}

export function deleteJob(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM jobs WHERE id = ?").run(id);
  return result.changes > 0;
}
