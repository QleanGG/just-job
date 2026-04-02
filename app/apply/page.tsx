"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MobileNav from "@/components/MobileNav";
import { WizardBottomBar, WizardShell } from "@/components/redesign/wizard-shell";
import { Icon, MiniDocument, StepSegments, SurfaceCard } from "@/components/redesign/ui";
import { useCVs } from "@/hooks/useCVs";
import {
  APPLY_SESSION_KEY,
  DEFAULT_APPLY_SESSION,
  type ApplySession,
  readApplySession,
  writeApplySession,
} from "@/lib/apply-session";

const infoCards = [
  {
    icon: "neurology",
    title: "Contextual AI",
    text: "The model adapts wording and emphasis to the actual requirements, not a generic prompt shell.",
  },
  {
    icon: "shield_lock",
    title: "Private Parsing",
    text: "Your pasted brief stays inside the tailoring flow so you can analyze sensitive hiring materials safely.",
  },
  {
    icon: "bolt",
    title: "Instant Results",
    text: "Once the brief is loaded, the next step generates a match score and tailored draft in one pass.",
  },
] as const;

const competencies = [
  ["Platform Strategy", "Direct match"],
  ["AI Product Operations", "High signal"],
  ["Enterprise Delivery", "Mentioned 4x"],
  ["Developer Tooling", "Strong overlap"],
] as const;

function GoogleMark() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#4285F4]">
      G
    </span>
  );
}

function readPersistedApplySession(): Partial<ApplySession> | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(APPLY_SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Partial<ApplySession>;
  } catch {
    return null;
  }
}

function hasStepTwoData(session: Partial<ApplySession> | null) {
  if (!session) {
    return false;
  }

  return ["jobTitle", "companyName", "jobDescription"].some((key) =>
    Object.prototype.hasOwnProperty.call(session, key),
  );
}

export default function ApplyPage() {
  const { data: cvs, isLoading } = useCVs();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState(DEFAULT_APPLY_SESSION.jobTitle);
  const [companyName, setCompanyName] = useState(DEFAULT_APPLY_SESSION.companyName);
  const [jobDescription, setJobDescription] = useState(DEFAULT_APPLY_SESSION.jobDescription);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(DEFAULT_APPLY_SESSION.acceptedAt);

  useEffect(() => {
    const session = readApplySession();
    const persistedSession = readPersistedApplySession();

    setSelectedCvId(session.selectedCvId);
    setJobTitle(session.jobTitle);
    setCompanyName(session.companyName);
    setJobDescription(session.jobDescription);
    setAcceptedAt(session.acceptedAt);

    if (persistedSession?.acceptedAt) {
      setCurrentStep(4);
      return;
    }

    if (session.selectedCvId && hasStepTwoData(persistedSession)) {
      setCurrentStep(3);
      return;
    }

    if (session.selectedCvId) {
      setCurrentStep(2);
    }
  }, []);

  const activeCv = cvs?.find((cv) => cv.is_preset) || cvs?.[0];

  useEffect(() => {
    if (!selectedCvId && activeCv?.id) {
      setSelectedCvId(activeCv.id);
    }
  }, [activeCv?.id, selectedCvId]);

  const selectedCv = cvs?.find((cv) => cv.id === selectedCvId);
  const selectedCvLabel = selectedCv?.display_name || selectedCv?.name || "Selected Base CV";

  function moveToStepOne() {
    setCurrentStep(1);
  }

  function moveToStepTwo() {
    if (!selectedCvId) {
      return;
    }

    writeApplySession({
      selectedCvId,
      acceptedAt: null,
    });
    setAcceptedAt(null);
    setCurrentStep(2);
  }

  function moveToStepThree() {
    writeApplySession({
      selectedCvId,
      jobTitle,
      companyName,
      jobDescription,
      acceptedAt: null,
    });
    setAcceptedAt(null);
    setCurrentStep(3);
  }

  function acceptDraft() {
    const nextAcceptedAt = new Date().toISOString();

    writeApplySession({
      selectedCvId,
      jobTitle,
      companyName,
      jobDescription,
      acceptedAt: nextAcceptedAt,
    });
    setAcceptedAt(nextAcceptedAt);
    setCurrentStep(4);
  }

  function returnToReview() {
    writeApplySession({
      selectedCvId,
      jobTitle,
      companyName,
      jobDescription,
      acceptedAt: null,
    });
    setAcceptedAt(null);
    setCurrentStep(3);
  }

  let title = "Choose Your CV";
  let description =
    "Start with the base that best matches the story you want to sharpen for this role.";
  let bottomBar = (
    <WizardBottomBar
      left={
        <Link
          href="/dashboard"
          className="inline-flex rounded-full px-4 py-2 text-sm font-semibold text-[var(--on-surface-variant)] transition hover:text-white"
        >
          Cancel
        </Link>
      }
      center={<StepSegments current={1} />}
      right={
        <button
          type="button"
          onClick={moveToStepTwo}
          disabled={!selectedCvId}
          className="primary-button rounded-full px-6 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <Icon name="arrow_forward" className="text-[18px]" />
        </button>
      }
    />
  );
  let content = (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="flex min-h-[24rem] items-center justify-center rounded-[1.75rem] border border-dashed border-white/15 bg-[rgba(9,19,40,0.45)] p-6 text-center">
        <div className="max-w-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[rgba(129,236,255,0.12)] text-[var(--primary)]">
            <Icon name="add" className="text-[30px]" />
          </div>
          <h2 className="mt-5 font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">
            Add New CV
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--on-surface-variant)]">
            Import a fresh resume or create a new base template before tailoring starts.
          </p>
        </div>
      </div>

      {isLoading ? (
        <SurfaceCard className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-5">
          <div className="mb-4 h-32 animate-pulse rounded-2xl bg-[var(--surface-container-highest)]" />
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/10" />
        </SurfaceCard>
      ) : null}

      {cvs?.map((cv) => (
        <SurfaceCard
          key={cv.id}
          onClick={() => setSelectedCvId(cv.id)}
          className={[
            "relative cursor-pointer rounded-[1.75rem] bg-[var(--surface-container-high)] p-5 hover:bg-[var(--surface-container-highest)]",
            selectedCvId === cv.id ? "ring-2 ring-[var(--primary)]" : "",
          ].join(" ")}
        >
          <div className="mb-4 flex h-32 items-center justify-center rounded-2xl bg-[var(--surface-container-highest)]">
            <MiniDocument title={cv.display_name || cv.name || "Untitled"} />
          </div>
          <div className="mt-3 text-sm font-semibold text-white">
            {cv.display_name || cv.name || "Untitled"}
          </div>
          {cv.id === activeCv?.id && (
            <span className="absolute right-4 top-4 rounded-full bg-[var(--primary)]/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--primary)]">
              Active Base
            </span>
          )}
          {selectedCvId === cv.id && (
            <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)]">
              <span className="material-symbols-outlined text-sm text-[var(--on-primary)]">check</span>
            </div>
          )}
        </SurfaceCard>
      ))}

      {!isLoading && cvs?.length === 0 ? (
        <SurfaceCard className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-6 text-sm text-[var(--on-surface-variant)]">
          No CVs yet. Add or import one before continuing.
        </SurfaceCard>
      ) : null}
    </div>
  );

  if (currentStep === 2) {
    title = "Job Details";
    description =
      "Define the role and paste the source brief so the tailoring engine works against the real hiring signal.";
    bottomBar = (
      <WizardBottomBar
        left={
          <button
            type="button"
            onClick={moveToStepOne}
            className="secondary-button rounded-full px-6 py-3"
          >
            <Icon name="arrow_back" className="text-[18px]" />
            Back
          </button>
        }
        center={<StepSegments current={2} />}
        right={
          <button
            type="button"
            onClick={moveToStepThree}
            className="primary-button rounded-full px-6"
          >
            Next
            <Icon name="arrow_forward" className="text-[18px]" />
          </button>
        }
      />
    );
    content = (
      <div className="space-y-6">
        <SurfaceCard className="rounded-[1.6rem] bg-[var(--surface-container-high)] p-5 hover:bg-[var(--surface-container-high)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--secondary)]">
            Selected Base CV
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-white">{selectedCvLabel}</div>
              <div className="mt-1 text-sm text-[var(--on-surface-variant)]">
                Step 1 stored this CV in session storage for the rest of the wizard.
              </div>
            </div>
            <button
              type="button"
              onClick={moveToStepOne}
              className="secondary-button rounded-full px-4 py-2"
            >
              Change
            </button>
          </div>
        </SurfaceCard>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-3">
            <span className="text-sm font-semibold text-white">Job Title</span>
            <input
              className="input-shell w-full"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              type="text"
            />
          </label>
          <label className="space-y-3">
            <span className="text-sm font-semibold text-white">Company Name</span>
            <input
              className="input-shell w-full"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              type="text"
            />
          </label>
        </div>

        <label className="block space-y-3">
          <span className="text-sm font-semibold text-white">Job Description</span>
          <textarea
            className="input-shell min-h-[350px] w-full resize-none leading-7"
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
          />
        </label>

        <div className="grid gap-5 xl:grid-cols-3">
          {infoCards.map((card) => (
            <SurfaceCard
              key={card.title}
              className="rounded-[1.6rem] bg-[var(--surface-container-high)] p-6 hover:bg-[var(--surface-container-highest)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-[rgba(129,236,255,0.12)] text-[var(--primary)]">
                <Icon name={card.icon} className="text-[24px]" />
              </div>
              <h2 className="mt-5 font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">
                {card.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--on-surface-variant)]">{card.text}</p>
            </SurfaceCard>
          ))}
        </div>
      </div>
    );
  }

  if (currentStep === 3) {
    title = "AI Tailoring";
    description =
      "Review the match analysis, inspect the draft, and decide whether to regenerate or move forward with this version.";
    bottomBar = (
      <WizardBottomBar
        left={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="secondary-button rounded-full px-6 py-3"
            >
              <Icon name="arrow_back" className="text-[18px]" />
              Back
            </button>
            <button type="button" className="secondary-button rounded-full px-6 py-3">
              <Icon name="autorenew" className="text-[18px]" />
              Regenerate
            </button>
          </div>
        }
        center={<StepSegments current={3} />}
        right={
          <>
            <button type="button" className="secondary-button rounded-full px-6 py-3">
              Save as Draft
            </button>
            <button
              type="button"
              onClick={acceptDraft}
              className="primary-button rounded-full px-6"
            >
              Accept &amp; Continue
              <Icon name="arrow_forward" className="text-[18px]" />
            </button>
          </>
        }
      />
    );
    content = (
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-4">
          <SurfaceCard className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-6 hover:bg-[var(--surface-container-high)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--secondary)]">
              Current Inputs
            </div>
            <div className="mt-5 space-y-3 text-sm text-[var(--on-surface-variant)]">
              <div>
                <div className="font-semibold text-white">{jobTitle}</div>
                <div>{companyName}</div>
              </div>
              <div>
                <div className="font-semibold text-white">{selectedCvLabel}</div>
                <div>Stored from step 1 and reused for this draft preview.</div>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-6 hover:bg-[var(--surface-container-high)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--secondary)]">
              Match score
            </div>
            <div className="mt-5 font-headline text-6xl font-extrabold tracking-[-0.06em] text-white">
              85%
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--on-surface-variant)]">
              Strong alignment on AI roadmap leadership, enterprise collaboration, and technical
              product depth.
            </p>
          </SurfaceCard>

          <SurfaceCard className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-6 hover:bg-[var(--surface-container-highest)]">
            <h2 className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">
              Matched Competencies
            </h2>
            <div className="mt-5 space-y-4">
              {competencies.map(([skill, badge]) => (
                <div
                  key={skill}
                  className="flex items-center justify-between gap-3 rounded-[1.2rem] bg-[rgba(9,19,40,0.6)] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(129,236,255,0.14)] text-[var(--primary)]">
                      <Icon name="check" className="text-[18px]" />
                    </span>
                    <span className="font-medium text-white">{skill}</span>
                  </div>
                  <span className="rounded-full bg-[rgba(110,155,255,0.14)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--secondary)]">
                    {badge}
                  </span>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <div className="rounded-[1.75rem] bg-[rgba(129,236,255,0.1)] p-6 shadow-[inset_0_0_0_1px_rgba(129,236,255,0.12)]">
            <div className="flex items-center gap-3 text-[var(--primary)]">
              <Icon name="tips_and_updates" className="text-[22px]" />
              <span className="text-sm font-semibold uppercase tracking-[0.22em]">
                AI Tailor&apos;s Note
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--on-surface)]">
              I elevated your work with API programs and enterprise discovery because the brief for{" "}
              {jobTitle} repeatedly centers platform adoption, technical alignment, and roadmap
              ownership.
            </p>
          </div>
        </div>

        <div className="xl:col-span-8">
          <div className="rounded-[1.9rem] bg-[rgba(9,19,40,0.86)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.2)]">
            <div className="flex flex-col gap-4 border-b border-white/8 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--on-surface-variant)]">
                    Document Preview
                  </div>
                  <div className="mt-1 font-semibold text-white">{selectedCvLabel} · Tailored Draft</div>
                </div>
                <span className="rounded-full bg-[rgba(129,236,255,0.14)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                  Optimized
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="glass-panel flex h-10 w-10 items-center justify-center rounded-full text-[var(--on-surface-variant)] transition hover:text-white"
                >
                  <Icon name="zoom_in" className="text-[18px]" />
                </button>
                <button
                  type="button"
                  className="glass-panel flex h-10 w-10 items-center justify-center rounded-full text-[var(--on-surface-variant)] transition hover:text-white"
                >
                  <Icon name="download" className="text-[18px]" />
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-[1.6rem] bg-[rgba(6,14,32,0.72)] p-5">
              <div className="mx-auto max-w-3xl rounded-[1.75rem] bg-white p-8 text-[#101621] shadow-[0_24px_50px_rgba(16,22,33,0.12)]">
                <div className="space-y-2 border-b border-slate-200 pb-5">
                  <div className="font-headline text-3xl font-extrabold tracking-[-0.05em]">
                    Guy Guzman
                  </div>
                  <div className="text-sm text-slate-600">
                    Product Manager · AI Platforms · Enterprise Systems
                  </div>
                </div>

                <div className="mt-6 space-y-6 text-sm leading-7 text-slate-700">
                  <section>
                    <div className="font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Profile
                    </div>
                    <p className="mt-3">
                      Technical product manager with a record of leading
                      <span className="border-b border-[var(--primary)] bg-[var(--primary)]/20 px-1">
                        {" "}
                        AI platform roadmaps
                      </span>
                      , enterprise programs, and data-heavy initiatives across cross-functional teams.
                    </p>
                  </section>

                  <section>
                    <div className="font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Recent Impact
                    </div>
                    <ul className="mt-3 space-y-3 pl-5">
                      <li>
                        Directed a
                        <span className="border-b border-[var(--primary)] bg-[var(--primary)]/20 px-1">
                          {" "}
                          developer tooling strategy
                        </span>
                        that improved adoption and reduced integration ambiguity for strategic accounts.
                      </li>
                      <li>
                        Built feedback loops between customers, GTM, and engineering to keep
                        <span className="border-b border-[var(--primary)] bg-[var(--primary)]/20 px-1">
                          {" "}
                          enterprise delivery
                        </span>
                        aligned with roadmap priorities.
                      </li>
                      <li>
                        Converted discovery into prioritization frameworks for
                        <span className="border-b border-[var(--primary)] bg-[var(--primary)]/20 px-1">
                          {" "}
                          applied AI experiences
                        </span>
                        shipped to high-volume users relevant to {jobDescription.slice(0, 92)}
                        {jobDescription.length > 92 ? "..." : ""}
                      </li>
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 4) {
    title = "Finalize";
    description =
      "Everything is ready. Save the tailored version to your dashboard, export it, and leave yourself notes for the follow-up.";
    bottomBar = (
      <WizardBottomBar
        left={
          <button
            type="button"
            onClick={returnToReview}
            className="secondary-button rounded-full px-6 py-3"
          >
            <Icon name="arrow_back" className="text-[18px]" />
            Back
          </button>
        }
        center={<StepSegments current={4} />}
        right={
          <Link href="/dashboard" className="primary-button rounded-full px-6">
            Open Dashboard
          </Link>
        }
      />
    );
    content = (
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-[1.75rem] bg-[rgba(129,236,255,0.12)] p-6 shadow-[inset_0_0_0_1px_rgba(129,236,255,0.12)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(129,236,255,0.18)] text-[var(--primary)]">
                <Icon name="check_circle" fill className="text-[24px]" />
              </span>
              <div>
                <h2 className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">
                  Your CV has been tailored and saved!
                </h2>
                <p className="mt-2 text-sm text-[var(--on-surface-variant)]">
                  The optimized draft is ready for export, tracking, and follow-up.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-[var(--primary)] transition hover:text-white"
            >
              Return to Dashboard
            </Link>
          </div>

          <SurfaceCard className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-6 hover:bg-[var(--surface-container-highest)]">
            <h3 className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">
              Summary
            </h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.2rem] bg-[rgba(9,19,40,0.6)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--on-surface-variant)]">
                  Role
                </div>
                <div className="mt-2 font-semibold text-white">{jobTitle}</div>
              </div>
              <div className="rounded-[1.2rem] bg-[rgba(9,19,40,0.6)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--on-surface-variant)]">
                  Company
                </div>
                <div className="mt-2 font-semibold text-white">{companyName}</div>
              </div>
              <div className="rounded-[1.2rem] bg-[rgba(9,19,40,0.6)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--on-surface-variant)]">
                  Base CV
                </div>
                <div className="mt-2 font-semibold text-white">{selectedCvLabel}</div>
              </div>
              <div className="rounded-[1.2rem] bg-[rgba(9,19,40,0.6)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--on-surface-variant)]">
                  Accepted
                </div>
                <div className="mt-2 font-semibold text-white">
                  {acceptedAt ? new Date(acceptedAt).toLocaleString() : "Pending confirmation"}
                </div>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-6 hover:bg-[var(--surface-container-highest)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">
                Notes
              </h3>
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--on-surface-variant)]">
                Private
              </span>
            </div>
            <textarea
              className="input-shell mt-5 min-h-[180px] w-full resize-none leading-7"
              defaultValue="Hiring manager seems to value platform storytelling over pure growth metrics. Mention the YouTube-scale data work if this moves to final round."
            />
          </SurfaceCard>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="group rounded-[1.75rem] bg-[var(--surface-container-high)] p-5 transition hover:bg-[var(--surface-container-highest)]">
              <div className="overflow-hidden rounded-[1.4rem] grayscale transition duration-300 group-hover:grayscale-0">
                <MiniDocument title="Tailored CV" />
              </div>
            </div>
            <div className="group rounded-[1.75rem] bg-[var(--surface-container-high)] p-5 transition hover:bg-[var(--surface-container-highest)]">
              <div className="overflow-hidden rounded-[1.4rem] grayscale transition duration-300 group-hover:grayscale-0">
                <MiniDocument title="Cover Letter" accent="secondary" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[1.75rem] bg-[rgba(9,19,40,0.75)] p-6 shadow-[0_22px_50px_rgba(0,0,0,0.18)]">
            <button type="button" className="primary-button w-full justify-center rounded-full">
              <Icon name="save" className="text-[18px]" />
              Save to Dashboard
            </button>
            <button
              type="button"
              className="secondary-button mt-3 w-full justify-center rounded-full py-3"
            >
              <GoogleMark />
              Create Google Doc
            </button>
          </div>

          <div className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-6">
            <div className="flex items-center gap-3 text-[var(--primary)]">
              <Icon name="schedule_send" className="text-[22px]" />
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.22em]">
                  Set Follow-up Reminder
                </div>
                <div className="mt-1 text-sm text-[var(--on-surface-variant)]">
                  Nudge yourself if no reply lands within 5 business days.
                </div>
              </div>
            </div>
            <div className="mt-5 rounded-[1.2rem] bg-[rgba(9,19,40,0.6)] p-4 text-sm text-[var(--on-surface)]">
              Suggested reminder: <span className="font-semibold">April 8, 2026 · 10:00</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <WizardShell step={currentStep} title={title} description={description} bottomBar={bottomBar}>
        {content}
      </WizardShell>
      <MobileNav />
    </>
  );
}
