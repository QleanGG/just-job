"use client";

import { useState, useEffect } from "react";
import StepIndicator from "@/components/StepIndicator";
import CVInput from "@/components/CVInput";
import JobInput from "@/components/JobInput";
import DiffView from "@/components/DiffView";
import ResultCard from "@/components/ResultCard";
import { CVSection, JobListing, TailoredSection, Job } from "@/lib/types";

type Step = 1 | 2 | 3;

export default function Home() {
  const [step, setStep] = useState<Step>(1);
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
  const [showHistory, setShowHistory] = useState(false);

  // Load history on mount
  useEffect(() => {
    fetchJobs();
    fetchLatestCv();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs?limit=20");
      if (res.ok) {
        const data = await res.json();
        setJobHistory(data);
      }
    } catch (err) {
      console.error("Failed to load jobs:", err);
    }
  };

  const fetchLatestCv = async () => {
    try {
      const res = await fetch("/api/cv");
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const latest = data[0];
          setCvUrl(latest.doc_url);
          setCvId(latest.id);
          if (latest.parsed_sections) {
            setCvSections(latest.parsed_sections);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load CV:", err);
    }
  };

  const handleCVLoaded = (sections: CVSection[], id?: string) => {
    if (id) setCvId(id);
    setCvSections(sections);
    fetchJobs(); // Refresh history
    setStep(2);
  };

  const handleJobLoaded = async (jobData: JobListing) => {
    // Create job in SQLite
    const id = crypto.randomUUID();
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
      if (res.ok) {
        setJobId(id);
      }
    } catch (err) {
      console.error("Failed to save job:", err);
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
        body: JSON.stringify({
          tailoredSections: tailored,
          jobId,
          jobTitle: job?.title,
          company: job?.company,
        }),
      });

      if (!exportRes.ok) {
        const err = await exportRes.json();
        throw new Error(err.error || "Failed to create document");
      }

      const { newDocUrl } = await exportRes.json();
      setResultUrl(newDocUrl);
      fetchJobs(); // Refresh history
      setLoadingMessage("");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setJob(null);
    setJobId("");
    setTailoredSections([]);
    setResultUrl("");
    setError("");
  };

  const loadJobFromHistory = (historyJob: Job) => {
    // Load a past job into the flow
    setJob({
      title: historyJob.job_title,
      company: historyJob.job_company || "",
      description: historyJob.job_description || "",
      source: "manual",
      url: historyJob.job_url || undefined,
    });
    setJobId(historyJob.id);
    setStep(3);
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="border-b border-[var(--color-border)] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-text)]">Just a Job</h1>
            <p className="text-xs text-[var(--color-text-muted)]">CV Tailoring</p>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] px-3 py-1.5 border border-[var(--color-border)] rounded-lg transition-colors"
          >
            {showHistory ? "Hide History" : `History (${jobHistory.length})`}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Step Indicator */}
        {!resultUrl && (
          <div className="mb-8">
            <StepIndicator currentStep={step} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)]">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="mb-6 p-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-center">
            <div className="animate-pulse mb-4">
              <div className="h-1 bg-[var(--color-border)] rounded-full w-3/4 mx-auto" />
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">{loadingMessage}</p>
          </div>
        )}

        {/* Result */}
        {resultUrl && !isLoading && (
          <ResultCard url={resultUrl} onReset={handleReset} />
        )}

        {/* Step Content */}
        {!resultUrl && !isLoading && (
          <>
            {step === 1 && (
              <CVInput
                initialUrl={cvUrl}
                onUrlChange={setCvUrl}
                onCVLoaded={(sections, id) => handleCVLoaded(sections, id)}
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
          </>
        )}
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-y-0 right-0 w-80 bg-[var(--color-surface)] border-l border-[var(--color-border)] overflow-y-auto z-50">
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--color-text)]">Job History</h2>
            <button
              onClick={() => setShowHistory(false)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {jobHistory.length === 0 ? (
              <p className="p-4 text-sm text-[var(--color-text-muted)]">No jobs yet</p>
            ) : (
              jobHistory.map((hJob) => (
                <div key={hJob.id} className="p-4 hover:bg-[var(--color-bg)]/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text)] truncate">
                        {hJob.job_title}
                      </p>
                      {hJob.job_company && (
                        <p className="text-xs text-[var(--color-text-muted)] truncate">
                          {hJob.job_company}
                        </p>
                      )}
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {new Date(hJob.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={hJob.status} />
                  </div>
                  {hJob.tailored_cv_url && (
                    <a
                      href={hJob.tailored_cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                    >
                      View CV
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    draft: "bg-[var(--color-bg)] text-[var(--color-text-muted)]",
    tailoring: "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
    done: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}>
      {status}
    </span>
  );
}
