import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function getServerClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

export function getAnonClient() {
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
  user_id: string;
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
  application_status?: "not_applied" | "applied" | "interview" | "offer" | "rejected" | "withdrawn" | null;
  tailored_cv_url: string | null;
  last_error: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type Revision = {
  id: string;
  job_id: string;
  user_id: string;
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
  user_id: string;
  created_at: string;
};

// CV queries
export async function getCvs() {
  const supabase = getServerClient();
  const { data, error } = await supabase.from("cvs").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return data as CV[];
}

export async function upsertCv(cv: { id?: string; name: string; docUrl: string; parsedSections?: unknown; isPreset?: boolean; displayName?: string; userId?: string }) {
  const supabase = getServerClient();
  const now = new Date().toISOString();

  // Unset other presets if this one is being set as preset (only for this user)
  if (cv.isPreset && cv.userId) {
    await supabase.from("cvs").update({ is_preset: false }).eq("is_preset", true).eq("user_id", cv.userId);
  }

  const { data, error } = await supabase
    .from("cvs")
    .upsert({
      ...(cv.id && { id: cv.id }),
      name: cv.name,
      doc_url: cv.docUrl,
      parsed_sections: cv.parsedSections || null,
      is_preset: cv.isPreset || false,
      display_name: cv.displayName || null,
      user_id: cv.userId || null,
      updated_at: now,
    }, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data as CV;
}

export async function getCvById(id: string, userId?: string) {
  const supabase = getServerClient();
  let query = supabase.from("cvs").select("*").eq("id", id);
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { data, error } = await query.single();
  if (error && error.code !== "PGRST116") throw error;
  return data as CV | null;
}

export async function deleteCv(id: string, userId?: string) {
  const supabase = getServerClient();
  // Cascade: keyword_analysis → revisions → jobs → cv
  try {
    // Get all jobs for this CV (scoped to user)
    const { data: cvJobs } = await supabase.from("jobs").select("id").eq("cv_id", id).eq("user_id", userId || "");
    const jobIds = (cvJobs || []).map((j: { id: string }) => j.id);

    // Delete keyword_analysis for those jobs (scoped to user)
    if (jobIds.length > 0 && userId) {
      await supabase.from("keyword_analysis").delete().in("job_id", jobIds).eq("user_id", userId);
    }

    // Delete revisions for those jobs (scoped to user)
    if (jobIds.length > 0 && userId) {
      await supabase.from("revisions").delete().in("job_id", jobIds).eq("user_id", userId);
    }

    // Delete jobs (scoped to user)
    if (userId) {
      await supabase.from("jobs").delete().eq("cv_id", id).eq("user_id", userId);
    }

    // Delete CV (scoped to user)
    const { error } = await supabase.from("cvs").delete().eq("id", id).eq("user_id", userId || "");
    if (error) throw error;
  } catch (err) {
    throw err;
  }
}

export async function getPresetCv() {
  const supabase = getServerClient();
  const { data, error } = await supabase.from("cvs").select("*").eq("is_preset", true).single();
  if (error && error.code !== "PGRST116") throw error;
  return data as CV | null;
}

// Job queries
export async function getJobs(limit = 50, userId?: string) {
  const supabase = getServerClient();
  let query = supabase.from("jobs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as Job[];
}

export async function getJobById(id: string, userId?: string) {
  const supabase = getServerClient();
  let query = supabase.from("jobs").select("*").eq("id", id);
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { data, error } = await query.single();
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

export async function updateJob(id: string, updates: Partial<{ status: string; tailoredCvUrl: string; lastError: string; applicationStatus: string }>, userId?: string) {
  const supabase = getServerClient();
  const now = new Date().toISOString();
  const dbUpdates: Record<string, unknown> = { updated_at: now };
  if ("status" in updates) dbUpdates.status = updates.status;
  if ("tailoredCvUrl" in updates) dbUpdates.tailored_cv_url = updates.tailoredCvUrl ?? null;
  if ("lastError" in updates) dbUpdates.last_error = updates.lastError ?? null;
  if ("applicationStatus" in updates) dbUpdates.application_status = updates.applicationStatus ?? null;

  let query = supabase.from("jobs").update(dbUpdates).eq("id", id);
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data as Job;
}

export async function deleteJob(id: string, userId?: string) {
  const supabase = getServerClient();
  let query = supabase.from("jobs").delete().eq("id", id);
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { error } = await query;
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
