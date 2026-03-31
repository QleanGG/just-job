"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import BottomNav from "./BottomNav";
import type { CV, KeywordAnalysis, Revision } from "@/lib/supabase";
import type { Job } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type StageFilterValue = "all" | "applied" | "interview" | "offer" | "rejected" | "withdrawn";
type AppStatus = NonNullable<Job["application_status"]> | "";
type JobDetailsResponse = {
  revisions: Revision[];
  analysis: KeywordAnalysis[];
  cvs: CV[];
};
type NoteEntry = { text: string; timestamp: string };

// ─── Constants ─────────────────────────────────────────────────────────────────

const STAGE_META: Record<string, { dot: string; badge: string; label: string }> = {
  "":        { dot: "bg-[var(--color-muted)]",    badge: "border-[var(--color-muted)]/40 text-[var(--color-text-muted)]",   label: "Not Applied" },
  applied:   { dot: "bg-[var(--color-info)]",     badge: "border-[var(--color-info)]/40 text-[var(--color-info)]",         label: "Applied" },
  interview: { dot: "bg-[var(--color-warning)]",   badge: "border-[var(--color-warning)]/40 text-[var(--color-warning)]",   label: "Interview" },
  offer:     { dot: "bg-[var(--color-success)]",   badge: "border-[var(--color-success)]/40 text-[var(--color-success)]",  label: "Offer" },
  rejected:  { dot: "bg-[var(--color-error)]",     badge: "border-[var(--color-error)]/40 text-[var(--color-error)]",       label: "Rejected" },
  withdrawn: { dot: "bg-[var(--color-muted)]",    badge: "border-[var(--color-muted)]/40 text-[var(--color-text-muted)]",   label: "Withdrawn" },
};

const STAGE_OPTIONS: { value: AppStatus; label: string }[] = [
  { value: "", label: "Not Applied" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

// ─── Utilities ─────────────────────────────────────────────────────────────────

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatLongDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });
}

// ─── Stage Badge ───────────────────────────────────────────────────────────────

function StageBadge({ status }: { status: string }) {
  const meta = STAGE_META[status] || STAGE_META[""];
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${meta.badge}`}>
      {meta.label}
    </span>
  );
}

// ─── Keyword Bar ───────────────────────────────────────────────────────────────

function KeywordBar({ analysis, revisions }: { analysis: KeywordAnalysis | null; revisions: Revision[] }) {
  if (!analysis) {
    return <p className="text-sm text-[var(--color-text-muted)]">No tailoring data yet</p>;
  }

  const total = analysis.matched_keywords.length + analysis.missed_keywords.length;
  const percentage = total > 0 ? Math.round((analysis.matched_keywords.length / total) * 100) : 0;
  const matchedRevision = revisions.find((r) => r.id === analysis.revision_id) || revisions[revisions.length - 1];

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-text-muted)]">
        v{matchedRevision?.revision_number ?? "?"} · {formatLongDate(analysis.created_at)}
      </p>
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-muted)]/30">
          <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${percentage}%` }} />
        </div>
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">{percentage}%</span>
      </div>
      <div className="flex min-w-0 flex-wrap gap-1.5">
        {analysis.matched_keywords.map((k) => (
          <span key={`m-${k}`} className="rounded-full border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-2 py-0.5 text-[10px] text-[var(--color-success)]">
            {k}
          </span>
        ))}
        {analysis.missed_keywords.map((k) => (
          <span key={`x-${k}`} className="rounded-full border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-2 py-0.5 text-[10px] text-[var(--color-warning)]">
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Job Card (LinkedIn/Jira style) ───────────────────────────────────────────

function JobCard({
  job,
  isSelected,
  onSelect,
  onRetailor,
}: {
  job: Job;
  isSelected: boolean;
  onSelect: () => void;
  onRetailor: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const meta = STAGE_META[job.application_status || ""] || STAGE_META[""];
  const tailoringMeta = getTailoringMeta(job);

  const handleRetailor = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRetailor();
  };

  return (
    <>
      {/* Use div wrapper + role=button for accessible clickable card */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => { onSelect(); setShowDetail(true); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { onSelect(); setShowDetail(true); } }}
        className={`w-full cursor-pointer rounded-xl border bg-[var(--color-surface)] p-4 text-left transition-all ${
          isSelected
            ? "border-[var(--color-accent)]/50 ring-1 ring-[var(--color-accent)]/20"
            : "border-[var(--color-border)] hover:border-[var(--color-muted)]"
        }`}
      >
        {/* Top row: dot + title + badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
            <span className="min-w-0 truncate text-sm font-semibold text-[var(--color-text)]">
              {job.job_title}
            </span>
          </div>
          <StageBadge status={job.application_status || ""} />
        </div>

        {/* Company + date */}
        <p className="mt-1.5 pl-4 text-xs text-[var(--color-text-secondary)]">
          {job.job_company || "Unknown company"}
          {job.updated_at ? (
            <span className="ml-2 text-[var(--color-text-muted)]">· {formatRelativeDate(job.updated_at)}</span>
          ) : null}
        </p>

        {/* Tailoring status */}
        <div className="mt-2 pl-4">
          <span className={`inline-flex items-center gap-1 text-[10px] ${tailoringMeta.color}`}>
            <span>{tailoringMeta.symbol}</span>
            <span>{tailoringMeta.label}</span>
          </span>
        </div>

        {/* Bottom actions */}
        <div className="mt-3 flex items-center gap-2 pl-4" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleRetailor}
            className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Re-tailor →
          </button>
          {job.job_url && (
            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              View ↗
            </a>
          )}
        </div>
      </div>

      {/* Slide-up Sheet */}
      {showDetail && (
        <JobSheet
          job={job}
          onClose={() => setShowDetail(false)}
          onRetailor={onRetailor}
        />
      )}
    </>
  );
}

// ─── Job Sheet (mobile detail view) ───────────────────────────────────────────

function JobSheet({
  job,
  onClose,
  onRetailor,
}: {
  job: Job;
  onClose: () => void;
  onRetailor: () => void;
}) {
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [optimisticStatus, setOptimisticStatus] = useState(job.application_status || "");
  const [isDragging, setIsDragging] = useState(false);

  const { data, isLoading, error } = useQuery<JobDetailsResponse, Error>({
    queryKey: ["job-details", job.id],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${job.id}/details`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const revisions = data?.revisions || [];
  const analysis = data?.analysis?.length ? data.analysis[data.analysis.length - 1] : null;
  const cvs = data?.cvs || [];
  const sourceCv: CV | null = job.cv_id ? cvs.find((c) => c.id === job.cv_id) || null : null;

  const handleStageClick = async (value: AppStatus) => {
    setStatusError(null);
    setOptimisticStatus(value);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_status: value }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Update failed");
      }
    } catch (e) {
      setOptimisticStatus(job.application_status || "");
      setStatusError(e instanceof Error ? e.message : "Update failed");
    }
  };

  const saveNote = () => {
    const text = noteDraft.trim();
    if (!text) return;
    const entry = { text, timestamp: new Date().toISOString() };
    setNotes((prev) => [entry, ...prev]);
    setNoteDraft("");
  };

  const handleDelete = async () => {
    if (!confirm("Delete this application? This cannot be undone.")) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Delete failed");
      }
      onClose();
      window.location.reload();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const meta = STAGE_META[optimisticStatus] || STAGE_META[""];
  const visibleDesc = expandedDescription || !job.job_description || job.job_description.length <= 150
    ? job.job_description || "No job description."
    : `${job.job_description.slice(0, 150)}...`;

  const revisionRows = revisions
    .filter((r) => r.tailored_cv_url)
    .sort((a, b) => b.revision_number - a.revision_number)
    .map((r) => ({ key: r.id, label: `v${r.revision_number}`, date: r.created_at, url: r.tailored_cv_url as string }));

  if (sourceCv?.doc_url) {
    revisionRows.push({ key: `orig-${sourceCv.id}`, label: "Original", date: sourceCv.updated_at, url: sourceCv.doc_url });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-[var(--color-bg)] shadow-[0_-8px_40px_rgba(0,0,0,0.5)]"
        style={{ height: "85vh", maxHeight: "85vh" }}
        onTouchMove={(e) => {
          if (e.touches[0].clientY < 60) setIsDragging(true);
          else setIsDragging(false);
        }}
        onTouchEnd={() => {
          if (isDragging) onClose();
          setIsDragging(false);
        }}
      >
        {/* Drag handle */}
        <div className="flex-none flex items-center justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-[var(--color-muted)]" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">{job.job_title}</h2>
              <button onClick={onClose} className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1">
                ✕
              </button>
            </div>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{job.job_company || "Unknown company"}</p>
            <div className="mt-2">
              <StageBadge status={optimisticStatus} />
            </div>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">Loading…</div>
          ) : error ? (
            <div className="py-8 text-center text-sm text-[var(--color-error)]">{error.message}</div>
          ) : (
            <>
              {/* Stage selector */}
              <section className="mb-5">
                <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Stage</p>
                <div className="flex flex-wrap gap-2">
                  {STAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => void handleStageClick(opt.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        optimisticStatus === opt.value
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                          : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-muted)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {statusError && <p className="mt-2 text-xs text-[var(--color-error)]">{statusError}</p>}
              </section>

              {/* Keyword match */}
              <section className="mb-5 border-t border-[var(--color-border)] pt-5">
                <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Keyword Match</p>
                <KeywordBar analysis={analysis} revisions={revisions} />
              </section>

              {/* Tailored CVs */}
              <section className="mb-5 border-t border-[var(--color-border)] pt-5">
                <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">CV Versions</p>
                {revisionRows.length > 0 ? (
                  <div className="space-y-2">
                    {revisionRows.map((row) => (
                      <div key={row.key} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
                        <div>
                          <span className="text-sm font-medium text-[var(--color-text)]">{row.label}</span>
                          <span className="ml-2 text-xs text-[var(--color-text-muted)]">· {formatShortDate(row.date)}</span>
                        </div>
                        <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]">
                          View ↗
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-muted)]">No tailored versions yet</p>
                )}
                <button
                  onClick={onRetailor}
                  className="mt-3 w-full rounded-lg border border-[var(--color-accent)] py-2 text-sm text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/10"
                >
                  Re-tailor for this job →
                </button>
              </section>

              {/* Job description */}
              {job.job_description && (
                <section className="mb-5 border-t border-[var(--color-border)] pt-5">
                  <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Job Description</p>
                  <p className="whitespace-pre-wrap text-sm text-[var(--color-text-secondary)]">{visibleDesc}</p>
                  {job.job_description.length > 150 && (
                    <button
                      onClick={() => setExpandedDescription((v) => !v)}
                      className="mt-2 text-xs text-[var(--color-accent)]"
                    >
                      {expandedDescription ? "Show less" : "Show more"}
                    </button>
                  )}
                </section>
              )}

              {/* Notes */}
              <section className="mb-5 border-t border-[var(--color-border)] pt-5">
                <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Notes</p>
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  onBlur={saveNote}
                  placeholder="Add a note…"
                  rows={2}
                  className="min-h-16 w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
                />
                <div className="mt-3 space-y-2">
                  {notes.map((n, i) => (
                    <div key={i} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                      <p className="whitespace-pre-wrap text-sm text-[var(--color-text-secondary)]">{n.text}</p>
                      <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">{formatLongDate(n.timestamp)}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Delete */}
              <section className="border-t border-[var(--color-border)] pt-5">
                <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[var(--color-error)]/60">Danger Zone</p>
                <button
                  onClick={() => void handleDelete()}
                  disabled={isDeleting}
                  className="w-full rounded-lg border border-[var(--color-error)]/30 py-2 text-sm text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting…" : "Delete Application"}
                </button>
                {deleteError && <p className="mt-2 text-xs text-[var(--color-error)]">{deleteError}</p>}
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Tailoring meta helper ────────────────────────────────────────────────────

function getTailoringMeta(job: Job) {
  switch (job.status) {
    case "tailoring": return { symbol: "⟳", label: "Tailoring…", color: "text-[var(--color-warning)]" };
    case "done":       return { symbol: "✓", label: "Tailored", color: "text-[var(--color-success)]" };
    case "failed":     return { symbol: "✗", label: "Failed", color: "text-[var(--color-error)]" };
    default:           return { symbol: "", label: "", color: "text-transparent" };
  }
}

// ─── Stage Filter Pills ────────────────────────────────────────────────────────

function StageFilter({
  value,
  onChange,
  counts,
}: {
  value: StageFilterValue;
  onChange: (v: StageFilterValue) => void;
  counts: Record<StageFilterValue, number>;
}) {
  const options: { value: StageFilterValue; label: string }[] = [
    { value: "all", label: "All" },
    { value: "applied", label: "Applied" },
    { value: "interview", label: "Interview" },
    { value: "offer", label: "Offer" },
    { value: "rejected", label: "Rejected" },
    { value: "withdrawn", label: "Withdrawn" },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${
            value === opt.value
              ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
              : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-muted)]"
          }`}
        >
          {opt.label} {counts[opt.value]}
        </button>
      ))}
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
      <svg className="mb-4 h-12 w-12 text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-sm font-medium text-[var(--color-text)]">{title}</p>
      {subtitle && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{subtitle}</p>}
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard({
  onJobSelect,
}: {
  onJobSelect: (job: Job) => void;
}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<StageFilterValue>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs?limit=200");
      if (!res.ok) throw new Error("Failed to fetch");
      setJobs(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void fetchJobs(); }, []);

  const filtered = useMemo(() => {
    let list = jobs;
    if (stageFilter !== "all") {
      list = list.filter((j) => (j.application_status || "") === stageFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (j) => j.job_title.toLowerCase().includes(q) || (j.job_company || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [jobs, stageFilter, searchQuery]);

  const counts = useMemo<Record<StageFilterValue, number>>(() => ({
    all: jobs.length,
    applied:   jobs.filter((j) => j.application_status === "applied").length,
    interview: jobs.filter((j) => j.application_status === "interview").length,
    offer:     jobs.filter((j) => j.application_status === "offer").length,
    rejected:  jobs.filter((j) => j.application_status === "rejected").length,
    withdrawn: jobs.filter((j) => j.application_status === "withdrawn").length,
  }), [jobs]);

  const handleRetailor = (job: Job) => {
    window.location.href = `/?jobId=${job.id}&cvId=${job.cv_id}`;
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Page header */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-[var(--color-text)]">Applications</h1>
            <p className="text-xs text-[var(--color-text-muted)]">{jobs.length} total</p>
          </div>
          <a
            href="/"
            className="rounded-lg bg-[var(--color-accent)] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            + New
          </a>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          {searchOpen ? (
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
              placeholder="Search jobs or companies…"
              className="w-full rounded-lg border border-[var(--color-accent)] bg-[var(--color-surface)] py-2.5 pl-9 pr-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
            />
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-3 text-sm text-[var(--color-text-muted)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search…
            </button>
          )}
          {searchOpen && (
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>

        {/* Stage filter */}
        <div className="mt-3">
          <StageFilter value={stageFilter} onChange={setStageFilter} counts={counts} />
        </div>
      </div>

      {/* Job card grid */}
      <div className="px-4 py-4 pb-24">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-4 text-center">
            <p className="text-sm text-[var(--color-error)]">{error}</p>
            <button onClick={() => void fetchJobs()} className="mt-2 text-xs text-[var(--color-error)] underline">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={jobs.length === 0 ? "No applications yet" : "No jobs match your filters"}
            subtitle={jobs.length === 0 ? "Create your first tailored application above." : "Try a different stage or search."}
          />
        ) : (
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {filtered.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSelected={false}
                onSelect={() => {}}
                onRetailor={() => handleRetailor(job)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <a
        href="/"
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-lg transition-colors hover:bg-[var(--color-accent-hover)] md:hidden"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </a>

      <BottomNav />
    </div>
  );
}
