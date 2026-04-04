"use client";

import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Icon, MatchRing, StatusPill, SurfaceCard } from "@/components/redesign/ui";
import { Sidebar } from "@/components/redesign/sidebar";
import { TopBar } from "@/components/redesign/topbar";
import { useApplications } from "@/hooks/useApplications";
import { useCVs } from "@/hooks/useCVs";
import type { JobDetails } from "@/hooks/useJobs";
import { APPLY_SESSION_KEY, SELECTED_CV_ID_KEY, writeApplySession } from "@/lib/apply-session";
import type { CV, Job } from "@/lib/supabase";

const STATUS_LABELS = {
  not_applied: "Not Applied",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
} as const;

const STATUS_RANGES = {
  not_applied: [62, 72],
  applied: [75, 85],
  interview: [85, 95],
  offer: [92, 99],
  rejected: [45, 62],
  withdrawn: [40, 58],
  unknown: [68, 78],
} as const;

const STAGE_OPTIONS = [
  { value: "not_applied", label: "Not Applied" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
] as const;

type StageFilter = "all" | (typeof STAGE_OPTIONS)[number]["value"];
type ApplicationStage = (typeof STAGE_OPTIONS)[number]["value"];

type ApplicationCard = {
  id: string;
  role: string;
  company: string;
  cvLabel: string;
  matchScore: number;
  statusLabel: "Not Applied" | "Applied" | "Interview" | "Offer" | "Rejected" | "Withdrawn";
  statusValue: ApplicationStage;
  createdLabel: string;
  description: string;
  emphasized: boolean;
  faded: boolean;
  hasTailoredCv: boolean;
  icon: string;
  jobUrl: string | null;
  jobDescription: string | null;
  tailoredCvUrl: string | null;
  baseCvUrl: string | null;
  rawJob: Job;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getCvTitle(cv?: CV) {
  return cv?.display_name || cv?.name || "No base CV";
}

function getStatusLabel(status: Job["application_status"]): ApplicationCard["statusLabel"] {
  if (!status) return "Not Applied";
  return STATUS_LABELS[status] || "Not Applied";
}

function getPlaceholderMatch(status: Job["application_status"], seedSource: string) {
  const range = status ? STATUS_RANGES[status] : STATUS_RANGES.unknown;
  const seed = Array.from(seedSource).reduce((total, char) => total + char.charCodeAt(0), 0);
  const [min, max] = range;
  return min + (seed % (max - min + 1));
}

function getDetailMatchScore(details?: JobDetails) {
  const analysis = details?.analysis.find((entry) => entry.matched_keywords.length + entry.missed_keywords.length > 0);
  if (!analysis) return null;

  const total = analysis.matched_keywords.length + analysis.missed_keywords.length;
  if (!total) return null;

  return Math.round((analysis.matched_keywords.length / total) * 100);
}

function getMatchScore(job: Job, details?: JobDetails) {
  return getDetailMatchScore(details) ?? getPlaceholderMatch(job.application_status, job.id);
}

function getMatchDescription(job: Job, details?: JobDetails) {
  const analysis = details?.analysis.find((entry) => entry.matched_keywords.length + entry.missed_keywords.length > 0);
  if (analysis) {
    const matched = analysis.matched_keywords.length;
    const missed = analysis.missed_keywords.length;
    return `${matched} matched keywords, ${missed} missed keywords from the first tailoring pass.`;
  }

  const status = job.application_status || "applied";
  if (status === "offer") return "Late-stage role with a strong overall fit signal.";
  if (status === "interview") return "Interview-stage application with a high estimated relevance score.";
  if (status === "rejected" || status === "withdrawn") return "Stored as a completed pipeline outcome for reference.";
  return "Estimated from pipeline stage until tailoring analysis is available.";
}

function getMostActiveLane(jobs: Job[]) {
  const counts = jobs.reduce<Record<string, number>>((accumulator, job) => {
    const key = job.application_status || "not_applied";
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  const [lane] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];
  return lane ? getStatusLabel(lane as Job["application_status"]) : "Pipeline building";
}

function escapeCsvCell(value: string | number | boolean | null | undefined) {
  const normalized = String(value ?? "").replace(/"/g, '""').replace(/\n/g, " ");
  return `"${normalized}"`;
}

function buildExportFilename() {
  return `dashboard-board-${new Date().toISOString().slice(0, 10)}.csv`;
}

export default function DashboardBody() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: jobs = [], isLoading } = useApplications();
  const { data: cvs = [] } = useCVs();
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!openActionId) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-dashboard-popover-root]")) {
        return;
      }

      setOpenActionId(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenActionId(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openActionId]);

  const detailQueries = useQueries({
    queries: jobs.map((job) => ({
      queryKey: ["job-details", job.id],
      queryFn: async (): Promise<JobDetails> => {
        const res = await fetch(`/api/jobs/${job.id}/details`);
        if (!res.ok) throw new Error("Failed to fetch job details");
        return res.json();
      },
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    })),
  });

  const cvById = new Map(cvs.map((cv) => [cv.id, cv]));
  const detailsByJobId = new Map(jobs.map((job, index) => [job.id, detailQueries[index]?.data]));

  const applications: ApplicationCard[] = jobs.map((job) => {
    const details = detailsByJobId.get(job.id);
    const matchScore = getMatchScore(job, details);
    const cv = job.cv_id ? cvById.get(job.cv_id) : undefined;
    const statusValue = (job.application_status || "not_applied") as ApplicationStage;

    return {
      id: job.id,
      role: job.job_title,
      company: job.job_company || "Unknown company",
      cvLabel: getCvTitle(cv),
      matchScore,
      statusLabel: getStatusLabel(job.application_status),
      statusValue,
      createdLabel: formatDate(job.created_at),
      description: getMatchDescription(job, details),
      emphasized: job.application_status === "offer" || job.application_status === "interview",
      faded: job.application_status === "rejected" || job.application_status === "withdrawn",
      hasTailoredCv: Boolean(job.tailored_cv_url),
      icon:
        job.application_status === "offer"
          ? "workspace_premium"
          : job.application_status === "interview"
            ? "record_voice_over"
            : job.application_status === "rejected" || job.application_status === "withdrawn"
              ? "history"
              : "work",
      jobUrl: job.job_url,
      jobDescription: job.job_description,
      tailoredCvUrl: job.tailored_cv_url,
      baseCvUrl: cv?.doc_url || null,
      rawJob: job,
    };
  });

  const totalJobs = jobs.length;
  const interviewCount = jobs.filter((job) => job.application_status === "interview").length;
  const offerCount = jobs.filter((job) => job.application_status === "offer").length;
  const jobsThisWeek = jobs.filter((job) => Date.now() - new Date(job.created_at).getTime() < 7 * 24 * 60 * 60 * 1000).length;
  const averageMatch = applications.length
    ? Math.round(applications.reduce((total, application) => total + application.matchScore, 0) / applications.length)
    : 0;
  const mostActiveLane = getMostActiveLane(jobs);
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const stageCounts = {
    all: totalJobs,
    not_applied: jobs.filter((job) => !job.application_status || job.application_status === "not_applied").length,
    applied: jobs.filter((job) => job.application_status === "applied").length,
    interview: interviewCount,
    offer: offerCount,
    rejected: jobs.filter((job) => job.application_status === "rejected").length,
    withdrawn: jobs.filter((job) => job.application_status === "withdrawn").length,
  };

  const filterOptions = [
    { value: "all", label: `All (${stageCounts.all})` },
    ...STAGE_OPTIONS.map((option) => ({
      value: option.value,
      label: `${option.label} (${stageCounts[option.value]})`,
    })),
  ];

  const filteredApplications = applications.filter((application) => {
    if (stageFilter !== "all" && application.statusValue !== stageFilter) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return [
      application.role,
      application.company,
      application.cvLabel,
      application.statusLabel,
      application.description,
      application.jobDescription || "",
    ].some((value) => value.toLowerCase().includes(normalizedSearch));
  });

  const stats = [
    { label: "Total Outreach", value: String(totalJobs), hint: `${jobsThisWeek} added this week` },
    { label: "Interviewing", value: String(interviewCount), hint: "Applications in live interview loops" },
    { label: "Offers Made", value: String(offerCount), hint: offerCount ? "Offer conversations are active" : "No live offers yet" },
    { label: "Average Match", value: `${averageMatch}%`, hint: "Across current applications" },
  ];

  const notificationItems = [
    ...(offerCount
      ? [{
          id: "offers",
          title: `${offerCount} offer${offerCount === 1 ? "" : "s"} active`,
          detail: "Filter the board to offer-stage applications.",
          onSelect: () => {
            setSearchQuery("");
            setStageFilter("offer");
          },
        }]
      : []),
    ...(interviewCount
      ? [{
          id: "interviews",
          title: `${interviewCount} interview${interviewCount === 1 ? "" : "s"} in progress`,
          detail: "Jump straight to live interview loops.",
          onSelect: () => {
            setSearchQuery("");
            setStageFilter("interview");
          },
        }]
      : []),
    ...(jobsThisWeek
      ? [{
          id: "recent",
          title: `${jobsThisWeek} new application${jobsThisWeek === 1 ? "" : "s"} this week`,
          detail: "Clear filters and review the newest additions.",
          onSelect: () => {
            setSearchQuery("");
            setStageFilter("all");
          },
        }]
      : []),
  ];

  function closeActionMenu() {
    setOpenActionId(null);
  }

  function handleRetailor(job: Job) {
    if (job.job_description?.trim()) {
      writeApplySession({
        selectedCvId: job.cv_id,
        jobTitle: job.job_title,
        companyName: job.job_company || "",
        jobDescription: job.job_description,
        acceptedAt: null,
      });
    } else {
      sessionStorage.removeItem(APPLY_SESSION_KEY);
      if (job.cv_id) {
        sessionStorage.setItem(SELECTED_CV_ID_KEY, job.cv_id);
      } else {
        sessionStorage.removeItem(SELECTED_CV_ID_KEY);
      }
    }

    closeActionMenu();
    router.push("/apply");

    if (!job.job_description?.trim()) {
      toast("Job details were incomplete, so Apply opened on the job details step.");
    }
  }

  function openExternal(url: string | null, label: string) {
    if (!url) {
      toast.error(`No ${label.toLowerCase()} is available yet.`);
      return;
    }

    closeActionMenu();
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleCopyJobDescription(job: Job) {
    if (!job.job_description?.trim()) {
      toast.error("No job description is stored for this application.");
      return;
    }

    try {
      await navigator.clipboard.writeText(job.job_description);
      closeActionMenu();
      toast.success("Job description copied.");
    } catch {
      toast.error("Could not copy the job description.");
    }
  }

  async function handleStageChange(jobId: string, nextStage: ApplicationStage) {
    setUpdatingJobId(jobId);

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_status: nextStage }),
      });

      const payload = (await response.json().catch(() => null)) as Job | { error?: string } | null;
      if (!response.ok || !payload || "error" in payload) {
        throw new Error(payload && "error" in payload ? payload.error || "Failed to update stage" : "Failed to update stage");
      }

      const updatedJob = payload as Job;
      queryClient.setQueryData<Job[]>(["applications"], (current = []) =>
        current.map((job) => (job.id === jobId ? updatedJob : job)),
      );
      await queryClient.invalidateQueries({ queryKey: ["job-details", jobId] });
      toast.success(`Stage updated to ${getStatusLabel(updatedJob.application_status)}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update stage.");
    } finally {
      setUpdatingJobId(null);
    }
  }

  async function handleDeleteApplication(job: ApplicationCard) {
    if (!window.confirm(`Delete ${job.role} at ${job.company}? This cannot be undone.`)) {
      return;
    }

    setDeletingJobId(job.id);

    try {
      const response = await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to delete application");
      }

      queryClient.setQueryData<Job[]>(["applications"], (current = []) =>
        current.filter((currentJob) => currentJob.id !== job.id),
      );
      closeActionMenu();
      toast.success("Application deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete application.");
    } finally {
      setDeletingJobId(null);
    }
  }

  function handleExportBoard() {
    if (!filteredApplications.length) {
      toast.error("There are no applications to export for the current view.");
      return;
    }

    const header = [
      "Role",
      "Company",
      "Status",
      "Match Score",
      "Base CV",
      "Tailored CV Ready",
      "Created",
      "Job URL",
      "Tailored CV URL",
      "Job Description",
    ];

    const rows = filteredApplications.map((application) => [
      application.role,
      application.company,
      application.statusLabel,
      application.matchScore,
      application.cvLabel,
      application.hasTailoredCv,
      application.createdLabel,
      application.jobUrl || "",
      application.tailoredCvUrl || "",
      application.jobDescription || "",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = buildExportFilename();
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Dashboard export downloaded.");
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--on-surface)]">
      <Sidebar active="dashboard" />
      <TopBar
        filterLabel="Stage"
        filterOptions={filterOptions}
        filterValue={stageFilter}
        notificationItems={notificationItems}
        onFilterChange={(value) => setStageFilter(value as StageFilter)}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search roles, companies, notes"
        searchValue={searchQuery}
      />
      <div className="relative min-h-screen lg:pl-64">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_top_right,rgba(129,236,255,0.12),transparent_34rem)]" />
        <main className="relative px-4 pb-10 pt-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-10">
            <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--secondary)]">
                  Dashboard
                </div>
                <h1 className="mt-3 font-headline text-4xl font-extrabold tracking-[-0.05em] text-white sm:text-5xl">
                  Application Tracker
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--on-surface-variant)]">
                  {totalJobs
                    ? `${totalJobs} tracked applications spanning drafts, interviews, and submitted roles.`
                    : "Track live applications, tailored CVs, and pipeline movement in one place."}
                </p>
              </div>

              <div className="rounded-[1.4rem] bg-[rgba(25,37,64,0.65)] px-5 py-4 text-sm text-[var(--on-surface-variant)] shadow-[0_18px_40px_rgba(0,0,0,0.14)]">
                Most active lane: <span className="font-semibold text-white">{mostActiveLane}</span>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <SurfaceCard
                  key={stat.label}
                  className="rounded-[1.6rem] bg-[var(--surface-container-high)] p-6 hover:bg-[var(--surface-container-highest)]"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--on-surface-variant)]">
                    {stat.label}
                  </div>
                  <div className="mt-4 font-headline text-4xl font-extrabold tracking-[-0.05em] text-white">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-sm text-[var(--on-surface-variant)]">{stat.hint}</div>
                </SurfaceCard>
              ))}
            </section>

            <section className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">Latest applications</h2>
                  <p className="mt-2 text-sm text-[var(--on-surface-variant)]">
                    {filteredApplications.length === applications.length
                      ? "High-signal view of where each tailored CV stands right now."
                      : `${filteredApplications.length} of ${applications.length} applications match the current search and stage filter.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportBoard}
                  className="hidden rounded-full bg-[rgba(25,37,64,0.72)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)] transition hover:bg-[rgba(25,37,64,0.92)] md:inline-flex"
                >
                  Export board
                </button>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-[var(--on-surface-variant)]">Loading...</div>
              ) : filteredApplications.length ? (
                <div className="grid gap-5 xl:grid-cols-2">
                  {filteredApplications.map((application) => {
                    const primaryCvUrl = application.tailoredCvUrl || application.baseCvUrl;
                    const primaryCvLabel = application.tailoredCvUrl ? "Open tailored CV" : "Open base CV";
                    const menuBusy = updatingJobId === application.id || deletingJobId === application.id;

                    return (
                      <SurfaceCard
                        key={application.id}
                        className={[
                          "relative rounded-[1.75rem] bg-[var(--surface-container-high)] p-6 hover:bg-[var(--surface-container-highest)]",
                          application.emphasized
                            ? "bg-[linear-gradient(160deg,rgba(20,31,56,0.96),rgba(25,37,64,0.92))] shadow-[0_24px_60px_rgba(0,29,78,0.22)]"
                            : "",
                          application.faded ? "opacity-50" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-[rgba(129,236,255,0.12)] text-[var(--primary)]">
                              <Icon name={application.icon} className="text-[28px]" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">
                                  {application.role}
                                </h3>
                                <span className="inline-flex items-center rounded-full bg-[rgba(110,155,255,0.14)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--secondary)]">
                                  {application.cvLabel}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-[var(--on-surface-variant)]">
                                {application.company} · Added {application.createdLabel}
                              </p>
                            </div>
                          </div>

                          <div className="relative" data-dashboard-popover-root>
                            <button
                              type="button"
                              className="rounded-full p-2 text-[var(--on-surface-variant)] transition hover:bg-white/5 hover:text-white"
                              aria-expanded={openActionId === application.id}
                              aria-label={`More actions for ${application.company}`}
                              onClick={() => setOpenActionId((current) => (current === application.id ? null : application.id))}
                            >
                              <Icon name="more_vert" className="text-[20px]" />
                            </button>

                            {openActionId === application.id ? (
                              <div className="absolute right-0 top-12 z-20 w-[22rem] max-w-[calc(100vw-3rem)] rounded-[1.35rem] border border-white/8 bg-[rgba(9,19,40,0.98)] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.32)]">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                                  Actions
                                </div>

                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                  <button
                                    type="button"
                                    onClick={() => handleRetailor(application.rawJob)}
                                    className="rounded-[1rem] border border-[var(--primary)]/20 px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-white/5"
                                  >
                                    Continue tailoring
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openExternal(application.jobUrl, "job post")}
                                    className="rounded-[1rem] border border-white/8 px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-white/5"
                                  >
                                    Open job post
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openExternal(primaryCvUrl, application.tailoredCvUrl ? "tailored CV" : "base CV")}
                                    className="rounded-[1rem] border border-white/8 px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-white/5"
                                  >
                                    {primaryCvLabel}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleCopyJobDescription(application.rawJob)}
                                    className="rounded-[1rem] border border-white/8 px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-white/5"
                                  >
                                    Copy brief
                                  </button>
                                </div>

                                <div className="mt-4 border-t border-white/8 pt-4">
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--on-surface-variant)]">
                                    Quick stage
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {STAGE_OPTIONS.map((stage) => (
                                      <button
                                        key={stage.value}
                                        type="button"
                                        disabled={menuBusy}
                                        onClick={() => void handleStageChange(application.id, stage.value)}
                                        className={[
                                          "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition",
                                          application.statusValue === stage.value
                                            ? "border-[var(--primary)] bg-[var(--primary)]/12 text-[var(--primary)]"
                                            : "border-white/8 text-[var(--on-surface-variant)] hover:border-white/20 hover:text-white",
                                          menuBusy ? "cursor-not-allowed opacity-60" : "",
                                        ]
                                          .filter(Boolean)
                                          .join(" ")}
                                      >
                                        {updatingJobId === application.id ? "Updating..." : stage.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="mt-4 border-t border-white/8 pt-4">
                                  <button
                                    type="button"
                                    disabled={menuBusy}
                                    onClick={() => void handleDeleteApplication(application)}
                                    className="w-full rounded-[1rem] border border-[var(--error)]/30 px-3 py-2 text-left text-sm font-semibold text-[var(--error)] transition hover:bg-[var(--error)]/10 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {deletingJobId === application.id ? "Deleting..." : "Delete application"}
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <MatchRing value={application.matchScore} size={78} />
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--on-surface-variant)]">
                                Match score
                              </div>
                              <div className="mt-2 text-sm text-[var(--on-surface-variant)]">
                                {application.description}
                              </div>
                              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]/80">
                                {application.hasTailoredCv ? "Tailored CV ready" : "Using base CV"}
                              </div>
                            </div>
                          </div>

                          <StatusPill status={application.statusLabel} />
                        </div>
                      </SurfaceCard>
                    );
                  })}
                </div>
              ) : (
                <SurfaceCard className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-10 text-center text-[var(--on-surface-variant)]">
                  {applications.length
                    ? "No applications match the current search and stage filter."
                    : "No applications yet."}
                </SurfaceCard>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
