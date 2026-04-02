"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MobileNav from "@/components/MobileNav";
import { WizardBottomBar, WizardShell } from "@/components/redesign/wizard-shell";
import { Icon, MiniDocument, StepSegments, SurfaceCard } from "@/components/redesign/ui";
import { useCVs } from "@/hooks/useCVs";
import { DEFAULT_APPLY_SESSION, readApplySession } from "@/lib/apply-session";

function GoogleMark() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#4285F4]">
      G
    </span>
  );
}

export default function ApplyStep4Page() {
  const { data: cvs } = useCVs();
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState(DEFAULT_APPLY_SESSION.jobTitle);
  const [companyName, setCompanyName] = useState(DEFAULT_APPLY_SESSION.companyName);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(DEFAULT_APPLY_SESSION.acceptedAt);

  useEffect(() => {
    const session = readApplySession();
    if (!session.selectedCvId) {
      return;
    }
    setSelectedCvId(session.selectedCvId);
    setJobTitle(session.jobTitle);
    setCompanyName(session.companyName);
    setAcceptedAt(session.acceptedAt);
  }, []);

  const selectedCv = cvs?.find((cv) => cv.id === selectedCvId);
  const selectedCvLabel = selectedCv?.display_name || selectedCv?.name || "Selected Base CV";

  return (
    <>
      <WizardShell
      step={4}
      title="Finalize"
      description="Everything is ready. Save the tailored version to your dashboard, export it, and leave yourself notes for the follow-up." 
      bottomBar={
        <WizardBottomBar
          left={
            <Link href="/apply/step3" className="secondary-button rounded-full px-6 py-3">
              <Icon name="arrow_back" className="text-[18px]" />
              Back
            </Link>
          }
          center={<StepSegments current={4} />}
          right={
            <Link href="/dashboard" className="primary-button rounded-full px-6">
              Open Dashboard
            </Link>
          }
        />
      }
    >
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
            <Link href="/dashboard" className="text-sm font-semibold text-[var(--primary)] transition hover:text-white">
              Return to Dashboard
            </Link>
          </div>

          <SurfaceCard className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-6 hover:bg-[var(--surface-container-highest)]">
            <h3 className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">Summary</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.2rem] bg-[rgba(9,19,40,0.6)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--on-surface-variant)]">Role</div>
                <div className="mt-2 font-semibold text-white">{jobTitle}</div>
              </div>
              <div className="rounded-[1.2rem] bg-[rgba(9,19,40,0.6)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--on-surface-variant)]">Company</div>
                <div className="mt-2 font-semibold text-white">{companyName}</div>
              </div>
              <div className="rounded-[1.2rem] bg-[rgba(9,19,40,0.6)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--on-surface-variant)]">Base CV</div>
                <div className="mt-2 font-semibold text-white">{selectedCvLabel}</div>
              </div>
              <div className="rounded-[1.2rem] bg-[rgba(9,19,40,0.6)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--on-surface-variant)]">Accepted</div>
                <div className="mt-2 font-semibold text-white">
                  {acceptedAt ? new Date(acceptedAt).toLocaleString() : "Pending confirmation"}
                </div>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-6 hover:bg-[var(--surface-container-highest)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">Notes</h3>
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--on-surface-variant)]">Private</span>
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
            <button type="button" className="primary-button w-full rounded-full justify-center">
              <Icon name="save" className="text-[18px]" />
              Save to Dashboard
            </button>
            <button
              type="button"
              className="secondary-button mt-3 w-full rounded-full justify-center py-3"
            >
              <GoogleMark />
              Create Google Doc
            </button>
          </div>

          <div className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-6">
            <div className="flex items-center gap-3 text-[var(--primary)]">
              <Icon name="schedule_send" className="text-[22px]" />
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.22em]">Set Follow-up Reminder</div>
                <div className="mt-1 text-sm text-[var(--on-surface-variant)]">Nudge yourself if no reply lands within 5 business days.</div>
              </div>
            </div>
            <div className="mt-5 rounded-[1.2rem] bg-[rgba(9,19,40,0.6)] p-4 text-sm text-[var(--on-surface)]">
              Suggested reminder: <span className="font-semibold">April 8, 2026 · 10:00</span>
            </div>
          </div>
        </div>
      </div>
    </WizardShell>
      <MobileNav />
    </>
  );
}
