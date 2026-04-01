"use client";

import { useQueries } from "@tanstack/react-query";
import MobileFAB from "@/components/MobileFAB";
import MobileHeader from "@/components/MobileHeader";
import MobileNav from "@/components/MobileNav";
import { Sidebar } from "@/components/redesign/sidebar";
import { TopBar } from "@/components/redesign/topbar";
import { Icon, MatchRing, StatusPill, SurfaceCard } from "@/components/redesign/ui";
import { useApplications } from "@/hooks/useApplications";
import { useCVs } from "@/hooks/useCVs";
import type { JobDetails } from "@/hooks/useJobs";
import type { CV, Job } from "@/lib/supabase";

const STATUS_LABELS = {
  not_applied: "Applied",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Rejected",
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

function getStatusLabel(status: Job["application_status"]): "Applied" | "Interview" | "Offer" | "Rejected" {
  if (!status) return "Applied";
  return STATUS_LABELS[status] || "Applied";
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

export default function DashboardPage() {
  const { data: jobs = [], isLoading } = useApplications();
  const { data: cvs = [] } = useCVs();

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

  const applications = jobs.map((job) => {
    const details = detailsByJobId.get(job.id);
    const matchScore = getMatchScore(job, details);
    const cv = job.cv_id ? cvById.get(job.cv_id) : undefined;

    return {
      id: job.id,
      role: job.job_title,
      company: job.job_company || "Unknown company",
      cvLabel: getCvTitle(cv),
      matchScore,
      statusLabel: getStatusLabel(job.application_status),
      createdLabel: formatDate(job.created_at),
      description: getMatchDescription(job, details),
      emphasized: job.application_status === "offer" || job.application_status === "interview",
      faded: job.application_status === "rejected" || job.application_status === "withdrawn",
      hasTailoredCv: Boolean(job.tailored_cv_url),
      icon: job.application_status === "offer"
        ? "workspace_premium"
        : job.application_status === "interview"
          ? "record_voice_over"
          : job.application_status === "rejected" || job.application_status === "withdrawn"
            ? "history"
            : "work",
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

  const stats = [
    { label: "Total Outreach", value: String(totalJobs), hint: `${jobsThisWeek} added this week` },
    { label: "Interviewing", value: String(interviewCount), hint: "Applications in live interview loops" },
    { label: "Offers Made", value: String(offerCount), hint: offerCount ? "Offer conversations are active" : "No live offers yet" },
    { label: "Average Match", value: `${averageMatch}%`, hint: "Across current applications" },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--on-surface)]">
      <Sidebar active="dashboard" />
      <MobileHeader />

      <div className="relative min-h-screen lg:pl-64">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_top_right,rgba(129,236,255,0.12),transparent_34rem)]" />
        <TopBar filterLabel="STAGE: ALL" searchPlaceholder="Search roles, companies, notes" />

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
                    High-signal view of where each tailored CV stands right now.
                  </p>
                </div>
                <button
                  type="button"
                  className="hidden rounded-full bg-[rgba(25,37,64,0.72)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)] transition hover:bg-[rgba(25,37,64,0.92)] md:inline-flex"
                >
                  Export board
                </button>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-[var(--on-surface-variant)]">Loading...</div>
              ) : applications.length ? (
                <div className="grid gap-5 xl:grid-cols-2">
                  {applications.map((application) => (
                    <SurfaceCard
                      key={application.id}
                      className={[
                        "rounded-[1.75rem] bg-[var(--surface-container-high)] p-6 hover:bg-[var(--surface-container-highest)]",
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

                        <button
                          type="button"
                          className="rounded-full p-2 text-[var(--on-surface-variant)] transition hover:bg-white/5 hover:text-white"
                          aria-label={`More actions for ${application.company}`}
                        >
                          <Icon name="more_vert" className="text-[20px]" />
                        </button>
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
                  ))}
                </div>
              ) : (
                <SurfaceCard className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-10 text-center text-[var(--on-surface-variant)]">
                  No applications yet.
                </SurfaceCard>
              )}
            </section>
          </div>
        </main>
      </div>

      <MobileFAB />
      <MobileNav />
    </div>
  );
}
