import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function getServerClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

export function getClientClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

export type CV = {
  id: string;
  name: string;
  doc_url: string;
  parsed_sections: unknown | null;
  is_preset: boolean | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Job = {
  id: string;
  cv_id: string | null;
  job_url: string | null;
  job_title: string;
  job_company: string | null;
  job_description: string | null;
  status: "draft" | "tailoring" | "done" | "failed";
  tailored_cv_url: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type Revision = {
  id: string;
  job_id: string;
  revision_number: number;
  tailored_cv_url: string | null;
  feedback: string | null;
  tailored_sections: unknown | null;
  created_at: string;
};

export type KeywordAnalysis = {
  id: string;
  job_id: string;
  revision_id: string | null;
  matched_keywords: string[];
  missed_keywords: string[];
  created_at: string;
};

// CV queries
export async function getCvs() {
  const supabase = getServerClient();
  const { data, error } = await supabase.from("cvs").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return data as CV[];
}

export async function upsertCv(cv: { id: string; name: string; docUrl: string; parsedSections?: unknown; isPreset?: boolean; displayName?: string }) {
  const supabase = getServerClient();
  const now = new Date().toISOString();

  // Unset other presets if this one is being set as preset
  if (cv.isPreset) {
    await supabase.from("cvs").update({ is_preset: false }).eq("is_preset", true);
  }

  const { data, error } = await supabase
    .from("cvs")
    .upsert({
      id: cv.id,
      name: cv.name,
      doc_url: cv.docUrl,
      parsed_sections: cv.parsedSections || null,
      is_preset: cv.isPreset || false,
      display_name: cv.displayName || null,
      updated_at: now,
    }, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data as CV;
}

export async function getCvById(id: string) {
  const supabase = getServerClient();
  const { data, error } = await supabase.from("cvs").select("*").eq("id", id).single();
  if (error && error.code !== "PGRST116") throw error;
  return data as CV | null;
}

export async function getPresetCv() {
  const supabase = getServerClient();
  const { data, error } = await supabase.from("cvs").select("*").eq("is_preset", true).single();
  if (error && error.code !== "PGRST116") throw error;
  return data as CV | null;
}

// Job queries
export async function getJobs(limit = 50) {
  const supabase = getServerClient();
  const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data as Job[];
}

export async function getJobById(id: string) {
  const supabase = getServerClient();
  const { data, error } = await supabase.from("jobs").select("*").eq("id", id).single();
  if (error && error.code !== "PGRST116") throw error;
  return data as Job | null;
}

export async function createJob(job: Omit<Job, "created_at" | "updated_at" | "tailored_cv_url" | "last_error">) {
  const supabase = getServerClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("jobs")
    .insert({ ...job, created_at: now, updated_at: now })
    .select()
    .single();
  if (error) throw error;
  return data as Job;
}

export async function updateJob(id: string, updates: Partial<{ status: string; tailoredCvUrl: string; lastError: string }>) {
  const supabase = getServerClient();
  const now = new Date().toISOString();
  const dbUpdates: Record<string, unknown> = { updated_at: now };
  if (updates.status) dbUpdates.status = updates.status;
  if (updates.tailoredCvUrl) dbUpdates.tailored_cv_url = updates.tailoredCvUrl;
  if (updates.lastError) dbUpdates.last_error = updates.lastError;

  const { data, error } = await supabase.from("jobs").update(dbUpdates).eq("id", id).select().single();
  if (error) throw error;
  return data as Job;
}

export async function deleteJob(id: string) {
  const supabase = getServerClient();
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) throw error;
}

// Revision queries
export async function createRevision(revision: {
  id: string;
  jobId: string;
  revisionNumber: number;
  tailoredCvUrl?: string;
  feedback?: string;
  tailoredSections?: unknown;
}) {
  const supabase = getServerClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("revisions")
    .insert({
      id: revision.id,
      job_id: revision.jobId,
      revision_number: revision.revisionNumber,
      tailored_cv_url: revision.tailoredCvUrl || null,
      feedback: revision.feedback || null,
      tailored_sections: revision.tailoredSections || null,
      created_at: now,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Revision;
}

export async function getRevisionsByJobId(jobId: string) {
  const supabase = getServerClient();
  const { data, error } = await supabase.from("revisions").select("*").eq("job_id", jobId).order("revision_number", { ascending: true });
  if (error) throw error;
  return data as Revision[];
}

export async function getLatestRevision(jobId: string) {
  const supabase = getServerClient();
  const { data, error } = await supabase.from("revisions").select("*").eq("job_id", jobId).order("revision_number", { ascending: false }).limit(1).single();
  if (error && error.code !== "PGRST116") throw error;
  return data as Revision | null;
}

export async function saveKeywordAnalysis(analysis: {
  id: string;
  jobId: string;
  revisionId?: string;
  matchedKeywords: string[];
  missedKeywords: string[];
}) {
  const supabase = getServerClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("keyword_analysis")
    .insert({
      id: analysis.id,
      job_id: analysis.jobId,
      revision_id: analysis.revisionId || null,
      matched_keywords: analysis.matchedKeywords,
      missed_keywords: analysis.missedKeywords,
      created_at: now,
    })
    .select()
    .single();
  if (error) throw error;
  return data as KeywordAnalysis;
}
