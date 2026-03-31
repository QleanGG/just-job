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

export interface KeywordAnalysisSummary {
  matchedKeywords: string[];
  missedKeywords: string[];
}

export interface ParseResult {
  sections: CVSection[];
  rawText: string;
}

export interface TailorResult {
  tailoredSections: TailoredSection[];
  keywordAnalysis: KeywordAnalysisSummary;
}

export interface ExportResult {
  newDocUrl: string;
  title: string;
  revisionId: string | null;
  revisionNumber: number | null;
}

export interface Job {
  id: string;
  cv_id: string | null;
  job_url: string | null;
  job_title: string;
  job_company: string | null;
  job_description: string | null;
  status: "draft" | "tailoring" | "done" | "failed";
  application_status?: "not_applied" | "applied" | "interview" | "offer" | "rejected" | "withdrawn" | null;
  tailored_cv_url: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}
