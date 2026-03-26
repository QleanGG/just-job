"use client";

import { useState, useEffect } from "react";
import StepIndicator from "@/components/StepIndicator";
import CVInput from "@/components/CVInput";
import JobInput from "@/components/JobInput";
import DiffView from "@/components/DiffView";
import ResultCard from "@/components/ResultCard";
import type { CV } from "@/lib/supabase";
import { CVSection, JobListing, TailoredSection, Job } from "@/lib/types";

type Step = 1 | 2 | 3;
type Tab = "new" | "history" | "cvs";

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [currentTab, setCurrentTab] = useState<Tab>("new");
  const [cvUrl, setCvUrl] = useState("");
  const [cvId, setCvId] = useState("");
  const [cvSections, setCvSections] = useState<CVSection[]>([]);
  const [job, setJob] = useState<JobListing | null>(null);
  const [jobId, setJobId] = useState("");
  const [tailoredSections, setTailoredSections] = useState<TailoredSection[]>([]);
  const [resultUrl, setResultUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");
  const [jobHistory, setJobHistory] = useState<Job[]>([]);
  const [cvPresets, setCvPresets] = useState<CV[]>([]);
  const [hasPreset, setHasPreset] = useState(false);
  const [presetCvId, setPresetCvId] = useState("");
  const [presetName, setPresetName] = useState("");

  useEffect(() => {
    fetchJobs();
    fetchCvPresets();
    fetchInitialCv();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs?limit=50");
      if (!res.ok) throw new Error("Failed to load jobs");
      const data = await res.json();
      setJobHistory(data);
    } catch (err) {
      console.error("Failed to load jobs:", err);
    }
  };

  const fetchCvPresets = async () => {
    try {
      const res = await fetch("/api/cv");
      if (!res.ok) throw new Error("Failed to load CVs");
      const data = await res.json();
      setCvPresets(data);
    } catch (err) {
      console.error("Failed to load CVs:", err);
    }
  };

  const applyCv = (cv: CV, nextStep?: Step) => {
    setCvUrl(cv.doc_url);
    setCvId(cv.id);
    setCvSections(Array.isArray(cv.parsed_sections) ? (cv.parsed_sections as CVSection[]) : []);
    if (nextStep) setStep(nextStep);
  };

  const fetchInitialCv = async () => {
    try {
      const presetRes = await fetch("/api/cv?preset=true");
      if (presetRes.ok) {
        const preset = await presetRes.json() as CV | null;
        if (preset) {
          applyCv(preset, 2);
          setHasPreset(true);
          setPresetCvId(preset.id);
          setPresetName(preset.display_name || "My Resume");
          return;
        }
      }
      const res = await fetch("/api/cv");
      if (res.ok) {
        const data = (await res.json()) as CV[];
        if (data.length > 0) applyCv(data[0]);
      }
    } catch (err) {
      console.error("Failed to load CV:", err);
    }
  };

  const handleCVLoaded = (sections: CVSection[], id?: string) => {
    if (id) setCvId(id);
    setCvSections(sections);
    fetchJobs();
    setStep(2);
  };

  const handlePresetSaved = (preset: { cvId: string; displayName: string; docUrl: string; sections: CVSection[] }) => {
    setCvId(preset.cvId);
    setCvUrl(preset.docUrl);
    setCvSections(preset.sections);
    setHasPreset(true);
    setPresetCvId(preset.cvId);
    setPresetName(preset.displayName || "My Resume");
    fetchCvPresets();
  };

  const handleJobLoaded = async (jobData: JobListing) => {
    const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    setError("");

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          cvId: cvId || null,
          jobUrl: jobData.url || null,
          jobTitle: jobData.title,
          jobCompany: jobData.company,
          jobDescription: jobData.description,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to save job");
      }

      setJobId(id);
      await fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save job");
      return;
    }

    setJob(jobData);
    setStep(3);
  };

  const handleTailor = async () => {
    setIsLoading(true);
    setError("");
    setLoadingMessage("Analyzing your CV and the job…");

    try {
      setLoadingMessage("Rewriting sections for maximum fit…");
      const tailorRes = await fetch("/api/cv/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: cvSections, job, jobId }),
      });

      if (!tailorRes.ok) {
        const err = await tailorRes.json();
        throw new Error(err.error || "Failed to tailor CV");
      }

      const { tailoredSections: tailored } = await tailorRes.json();
      setTailoredSections(tailored);

      setLoadingMessage("Creating your new Google Doc…");
      const exportRes = await fetch("/api/cv/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tailoredSections: tailored, jobId, jobTitle: job?.title, company: job?.company, cvId, cvUrl }),
      });

      if (!exportRes.ok) {
        const err = await exportRes.json();
        throw new Error(err.error || "Failed to create document");
      }

      const { newDocUrl } = await exportRes.json();
      setResultUrl(newDocUrl);
      fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep(hasPreset ? 2 : 1);
    setJob(null);
    setJobId("");
    setTailoredSections([]);
    setResultUrl("");
    setError("");
  };

  const loadJobFromHistory = (historyJob: Job) => {
    setJob({
      title: historyJob.job_title,
      company: historyJob.job_company || "",
      description: historyJob.job_description || "",
      source: "manual",
      url: historyJob.job_url || undefined,
    });
    setJobId(historyJob.id);
    setCurrentTab("new");
    setStep(3);
  };

  return (
    <main className="min-h-screen">
      {/* Nav Bar */}
      <div className="border-b border-[var(--color-border)] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-text)]">Just a Job</h1>
            <p className="text-xs text-[var(--color-text-muted)]">CV Tailoring</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1">
            <button
              onClick={() => setCurrentTab("new")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentTab === "new"
                  ? "bg-[var(--color-bg)] text-[var(--color-text)] shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              New
            </button>
            <button
              onClick={() => setCurrentTab("cvs")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                currentTab === "cvs"
                  ? "bg-[var(--color-bg)] text-[var(--color-text)] shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              My CVs
              {cvPresets.length > 0 && (
                <span className="text-xs bg-[var(--color-bg)] border border-[var(--color-border)] px-1.5 py-0.5 rounded-full">
                  {cvPresets.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentTab("history")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                currentTab === "history"
                  ? "bg-[var(--color-bg)] text-[var(--color-text)] shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              History
              {jobHistory.length > 0 && (
                <span className="text-xs bg-[var(--color-bg)] border border-[var(--color-border)] px-1.5 py-0.5 rounded-full">
                  {jobHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {currentTab === "cvs" ? (
          <CvsView
            cvs={cvPresets}
            currentCvId={cvId}
            onSelect={(cv) => {
              applyCv(cv, 2);
              setCurrentTab("new");
            }}
            onRefresh={fetchCvPresets}
          />
        ) : currentTab === "history" ? (
          <JobHistoryView jobs={jobHistory} onSelect={loadJobFromHistory} />
        ) : (
          <>
            {!resultUrl && !isLoading && (
              <div className="mb-8">
                <StepIndicator currentStep={step} />
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)]">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="mb-6 p-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-center">
                <div className="animate-pulse mb-4">
                  <div className="h-1 bg-[var(--color-border)] rounded-full w-3/4 mx-auto" />
                </div>
                <p className="text-sm text-[var(--color-text-muted)]">{loadingMessage}</p>
              </div>
            )}

            {resultUrl && !isLoading && (
              <ResultCard url={resultUrl} onReset={handleReset} />
            )}

            {!resultUrl && !isLoading && (
              <div className="space-y-6">
                {step === 1 && (
                  <CVInput
                    initialUrl={cvUrl}
                    onUrlChange={setCvUrl}
                    onCVLoaded={(sections, id) => handleCVLoaded(sections, id)}
                    onPresetSaved={handlePresetSaved}
                  />
                )}

                {step === 2 && (
                  <JobInput onJobLoaded={handleJobLoaded} onBack={() => setStep(1)} />
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <DiffView
                      originalSections={cvSections}
                      tailoredSections={tailoredSections}
                      job={job}
                    />

                    <div className="flex gap-4">
                      <button
                        onClick={() => setStep(2)}
                        className="flex-1 py-3 px-6 border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleTailor}
                        className="flex-1 py-3 px-6 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Generate Tailored CV
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    draft: "bg-[var(--color-bg)] text-[var(--color-text-muted)]",
    tailoring: "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
    done: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
    failed: "bg-[var(--color-error)]/10 text-[var(--color-error)]",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}>
      {status}
    </span>
  );
}

function JobHistoryView({ jobs, onSelect }: { jobs: Job[]; onSelect: (job: Job) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
        Job History ({jobs.length})
      </h2>

      {jobs.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-text-muted)] text-sm">
          No jobs yet — start by creating a new tailored CV
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)] overflow-hidden">
          {jobs.map((hJob) => (
            <div key={hJob.id} className="p-4 hover:bg-[var(--color-bg)]/50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => onSelect(hJob)}
                    className="text-left w-full"
                  >
                    <p className="text-sm font-medium text-[var(--color-text)] truncate hover:text-[var(--color-accent)] transition-colors">
                      {hJob.job_title}
                    </p>
                  </button>
                  {hJob.job_company && (
                    <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                      {hJob.job_company}
                    </p>
                  )}
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {new Date(hJob.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={hJob.status} />
                  {hJob.tailored_cv_url && (
                    <a
                      href={hJob.tailored_cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
                    >
                      View CV
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function makeCvPreset(id: string, displayName?: string) {
  return { display_name: displayName || "My Resume", is_preset: true };
}

function CvsView({
  cvs,
  currentCvId,
  onSelect,
  onRefresh,
}: {
  cvs: CV[];
  currentCvId: string;
  onSelect: (cv: CV) => void;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleMakeActive = async (cv: CV) => {
    setLoading(true);
    try {
      await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cv.id,
          name: cv.name || "CV",
          docUrl: cv.doc_url,
          parsedSections: cv.parsed_sections,
          isPreset: true,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to make preset:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
        My CVs ({cvs.length})
      </h2>

      {cvs.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-text-muted)] text-sm">
          No CVs saved yet — load a CV from Google Docs to get started
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)] overflow-hidden">
          {cvs.map((cv) => (
            <div key={cv.id} className="p-4 hover:bg-[var(--color-bg)]/50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">
                      {cv.display_name || cv.name || "Untitled CV"}
                    </p>
                    {cv.is_preset && (
                      <span className="px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs rounded-full font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                    {cv.doc_url}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Updated {new Date(cv.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <a
                    href={cv.doc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
                  >
                    Open
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  {!cv.is_preset && (
                    <button
                      onClick={() => handleMakeActive(cv)}
                      disabled={loading}
                      className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50"
                    >
                      Set as active
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

