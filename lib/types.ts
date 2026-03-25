export type SectionType =
  | "summary"
  | "experience"
  | "skills"
  | "education"
  | "certifications"
  | "other";

export interface CVSection {
  type: SectionType;
  title: string;
  content: string;
  originalIndex: number;
}

export interface JobListing {
  title: string;
  company: string;
  description: string;
  source: "linkedin" | "indeed" | "greenhouse" | "lever" | "workday" | "manual";
  url?: string;
}

export interface SectionChange {
  original: string;
  tailored: string;
  changeType: "reword" | "add" | "remove" | "reorder" | "keep";
}

export interface TailoredSection extends CVSection {
  changes: SectionChange[];
}

export interface ParseResult {
  sections: CVSection[];
  rawText: string;
}

export interface TailorResult {
  tailoredSections: TailoredSection[];
}

export interface ExportResult {
  newDocUrl: string;
  title: string;
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
