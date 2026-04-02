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
import type { CV } from "@/lib/supabase";
import type { CVSection, KeywordAnalysisSummary, TailoredSection } from "@/lib/types";

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

type TailoredPreviewSection = {
  index: number;
  title: string;
  tailored: string;
  changes: TailoredSection["changes"];
};

function getParsedSections(parsedSections: CV["parsed_sections"]): CVSection[] {
  if (!Array.isArray(parsedSections)) {
    return [];
  }

  return parsedSections
    .map((section, index) => {
      if (!section || typeof section !== "object") {
        return null;
      }

      const candidate = section as Partial<CVSection>;

      return {
        type: candidate.type || "other",
        title: candidate.title || `Section ${index + 1}`,
        content: candidate.content || "",
        originalIndex: typeof candidate.originalIndex === "number" ? candidate.originalIndex : index,
      } as CVSection;
    })
    .filter((section): section is CVSection => Boolean(section));
}

function buildFallbackCvSections(selectedCvLabel: string): CVSection[] {
  return [
    {
      type: "summary",
      title: "Professional Summary",
      content:
        `The base CV "${selectedCvLabel}" is selected, but parsed summary content is unavailable. Preserve the original experience and rewrite only what exists.`,
      originalIndex: 0,
    },
    {
      type: "experience",
      title: "Experience Highlights",
      content:
        "Experience bullets are unavailable in parsed CV data. Reframe only the candidate's existing product, enterprise, and technical work toward the role requirements.",
      originalIndex: 1,
    },
    {
      type: "skills",
      title: "Skills",
      content:
        "Skills data is unavailable in parsed CV data. Prioritize only skills already present in the original CV and avoid inventing new competencies.",
      originalIndex: 2,
    },
  ];
}

function buildCvSections(cv: CV | undefined, selectedCvLabel: string): CVSection[] {
  const parsedSections = getParsedSections(cv?.parsed_sections);
  const validSections = parsedSections.filter(
    (section) => section.title.trim().length > 0 || section.content.trim().length > 0,
  );

  return validSections.length > 0 ? validSections : buildFallbackCvSections(selectedCvLabel);
}

function toPreviewSections(
  apiSections: TailoredSection[] | null | undefined,
  fallbackSections: CVSection[],
): TailoredPreviewSection[] {
  if (!apiSections?.length) {
    return fallbackSections.map((section, index) => ({
      index: section.originalIndex ?? index,
      title: section.title,
      tailored: section.content,
      changes: [],
    }));
  }

  return apiSections.map((section, index) => ({
    index: typeof section.originalIndex === "number" ? section.originalIndex : index,
    title: section.title || fallbackSections[index]?.title || `Section ${index + 1}`,
    tailored: section.content || fallbackSections[index]?.content || "",
    changes: Array.isArray(section.changes) ? section.changes : [],
  }));
}

function calculateMatchScore(
  sections: TailoredPreviewSection[],
  keywordAnalysis: KeywordAnalysisSummary | null,
) {
  const totalChanges = sections.reduce((sum, section) => sum + section.changes.length, 0);
  const matchedKeywords = keywordAnalysis?.matchedKeywords.length ?? 0;
  const missedKeywords = keywordAnalysis?.missedKeywords.length ?? 0;
  const overlapRatio =
    matchedKeywords + missedKeywords > 0
      ? matchedKeywords / (matchedKeywords + missedKeywords)
      : 0.5;

  return Math.max(72, Math.min(98, Math.round(72 + overlapRatio * 16 + Math.min(totalChanges, 5) * 3)));
}

function formatKeyword(keyword: string) {
  return keyword
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getMatchedCompetencies(keywordAnalysis: KeywordAnalysisSummary | null) {
  if (!keywordAnalysis?.matchedKeywords.length) {
    return competencies;
  }

  const labels = ["Direct match", "Job signal", "Strong overlap", "High priority"] as const;

  return keywordAnalysis.matchedKeywords.slice(0, 4).map((keyword, index) => [
    formatKeyword(keyword),
    labels[index % labels.length],
  ]) as Array<readonly [string, string]>;
}

async function tailorCvPreview({
  cvSections,
  jobTitle,
  companyName,
  jobDescription,
}: {
  cvSections: CVSection[];
  jobTitle: string;
  companyName: string;
  jobDescription: string;
}) {
  const response = await fetch("/api/cv/tailor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cv: cvSections.map(({ title, content }) => ({ title, content })),
      job: {
        title: jobTitle,
        company: companyName,
        description: jobDescription,
      },
      jobId: null,
    }),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(error?.error || "Failed to tailor CV");
  }

  const data = (await response.json()) as {
    keywordAnalysis?: KeywordAnalysisSummary | null;
    sections?: Array<{
      index?: number;
      tailored?: string;
      changes?: TailoredSection["changes"];
    }>;
    tailoredSections?: TailoredSection[];
  };

  if (Array.isArray(data.sections) && data.sections.length > 0) {
    const previewSections = data.sections.map((section, index) => ({
      index: typeof section.index === "number" ? section.index : index,
      title: cvSections[index]?.title || `Section ${index + 1}`,
      tailored: section.tailored || cvSections[index]?.content || "",
      changes: Array.isArray(section.changes) ? section.changes : [],
    }));

    return {
      sections: previewSections,
      keywordAnalysis: data.keywordAnalysis || null,
    };
  }

  return {
    sections: toPreviewSections(data.tailoredSections, cvSections),
    keywordAnalysis: data.keywordAnalysis || null,
  };
}

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
  const [tailoredSections, setTailoredSections] = useState<TailoredPreviewSection[] | null>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [matchScore, setMatchScore] = useState(85);
  const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysisSummary | null>(null);
  const [tailorError, setTailorError] = useState<string | null>(null);

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
    setTailorError(null);
    setCurrentStep(1);
  }

  function moveToStepTwo() {
    if (!selectedCvId) {
      return;
    }

    setTailoredSections(null);
    setKeywordAnalysis(null);
    setTailorError(null);
    setMatchScore(85);
    writeApplySession({
      selectedCvId,
      acceptedAt: null,
    });
    setAcceptedAt(null);
    setCurrentStep(2);
  }

  function moveToStepThree() {
    setTailoredSections(null);
    setKeywordAnalysis(null);
    setTailorError(null);
    setMatchScore(85);
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

  const selectedCvSections = buildCvSections(selectedCv, selectedCvLabel);
  const displayedCompetencies = getMatchedCompetencies(keywordAnalysis);
  const totalTailorChanges =
    tailoredSections?.reduce((sum, section) => sum + section.changes.length, 0) ?? 0;

  async function handleTailorPreview() {
    if (!selectedCvId || !selectedCv) {
      return;
    }

    setIsTailoring(true);
    setTailorError(null);

    try {
      const result = await tailorCvPreview({
        cvSections: selectedCvSections,
        jobTitle,
        companyName,
        jobDescription,
      });

      setTailoredSections(result.sections);
      setKeywordAnalysis(result.keywordAnalysis);
      setMatchScore(calculateMatchScore(result.sections, result.keywordAnalysis));
    } catch (error) {
      setTailorError(error instanceof Error ? error.message : "Failed to tailor CV");
      setTailoredSections(null);
      setKeywordAnalysis(null);
      setMatchScore(85);
    } finally {
      setIsTailoring(false);
    }
  }

  useEffect(() => {
    if (
      currentStep !== 3 ||
      tailoredSections ||
      isTailoring ||
      tailorError ||
      !selectedCvId ||
      !selectedCv
    ) {
      return;
    }

    void handleTailorPreview();
  }, [
    currentStep,
    tailoredSections,
    isTailoring,
    tailorError,
    selectedCvId,
    selectedCv,
    selectedCvSections,
    jobTitle,
    companyName,
    jobDescription,
  ]);

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
            <button
              type="button"
              onClick={() => void handleTailorPreview()}
              disabled={isTailoring || !selectedCvId}
              className="secondary-button rounded-full px-6 py-3 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="autorenew" className="text-[18px]" />
              {isTailoring ? "Regenerating..." : "Regenerate"}
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
              {matchScore}%
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--on-surface-variant)]">
              {isTailoring
                ? "Analyzing your base CV against the role requirements and rewriting each section."
                : `Built from ${totalTailorChanges} tailored edits${keywordAnalysis?.matchedKeywords.length ? ` and ${keywordAnalysis.matchedKeywords.length} matched keywords` : ""}.`}
            </p>
          </SurfaceCard>

          <SurfaceCard className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-6 hover:bg-[var(--surface-container-highest)]">
            <h2 className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">
              Matched Competencies
            </h2>
            <div className="mt-5 space-y-4">
              {displayedCompetencies.map(([skill, badge]) => (
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
              {isTailoring
                ? "Tailoring your CV..."
                : `I rewrote ${selectedCvSections.length} sections for ${jobTitle} at ${companyName}, emphasizing the strongest overlap with the brief while keeping the draft anchored to your existing experience.`}
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
                    {selectedCvLabel}
                  </div>
                  <div className="text-sm text-slate-600">
                    Tailored for {jobTitle}
                    {companyName ? ` · ${companyName}` : ""}
                  </div>
                </div>

                {isTailoring ? (
                  <div className="flex min-h-[26rem] flex-col items-center justify-center gap-4 text-center text-slate-600">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#4dd8f0] border-t-transparent" />
                    <div className="font-semibold text-slate-800">Tailoring your CV...</div>
                    <p className="max-w-md text-sm leading-6">
                      The AI is rewriting your selected sections against the job brief and updating
                      this preview in place.
                    </p>
                  </div>
                ) : tailorError ? (
                  <div className="flex min-h-[26rem] flex-col items-center justify-center gap-4 text-center text-slate-600">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-[#b42318]">
                      <Icon name="error" className="text-[20px]" />
                    </div>
                    <div className="font-semibold text-slate-800">Tailoring couldn&apos;t finish</div>
                    <p className="max-w-md text-sm leading-6">{tailorError}</p>
                    <button
                      type="button"
                      onClick={() => void handleTailorPreview()}
                      className="secondary-button rounded-full px-5 py-3"
                    >
                      <Icon name="autorenew" className="text-[18px]" />
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 space-y-6 text-sm leading-7 text-slate-700">
                    {(tailoredSections || []).map((section) => (
                      <section key={`${section.index}-${section.title}`}>
                        <div className="font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {section.title}
                        </div>
                        <div className="mt-3 whitespace-pre-line">{section.tailored}</div>
                      </section>
                    ))}
                  </div>
                )}
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
