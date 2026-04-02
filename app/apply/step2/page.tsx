"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MobileNav from "@/components/MobileNav";
import { WizardBottomBar, WizardShell } from "@/components/redesign/wizard-shell";
import { Icon, StepSegments, SurfaceCard } from "@/components/redesign/ui";
import { useCVs } from "@/hooks/useCVs";
import { DEFAULT_APPLY_SESSION, readApplySession, writeApplySession } from "@/lib/apply-session";

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

export default function ApplyStep2Page() {
  const router = useRouter();
  const { data: cvs } = useCVs();
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState(DEFAULT_APPLY_SESSION.jobTitle);
  const [companyName, setCompanyName] = useState(DEFAULT_APPLY_SESSION.companyName);
  const [jobDescription, setJobDescription] = useState(DEFAULT_APPLY_SESSION.jobDescription);

  useEffect(() => {
    const session = readApplySession();
    if (!session.selectedCvId) {
      router.replace("/apply/step1");
      return;
    }
    setSelectedCvId(session.selectedCvId);
    setJobTitle(session.jobTitle);
    setCompanyName(session.companyName);
    setJobDescription(session.jobDescription);
  }, [router]);

  const selectedCv = cvs?.find((cv) => cv.id === selectedCvId);
  const selectedCvLabel = selectedCv?.display_name || selectedCv?.name || "Selected Base CV";

  return (
    <>
      <WizardShell
      step={2}
      title="Job Details"
      description="Define the role and paste the source brief so the tailoring engine works against the real hiring signal."
      bottomBar={
        <WizardBottomBar
          left={
            <Link href="/apply/step1" className="secondary-button rounded-full px-6 py-3">
              <Icon name="arrow_back" className="text-[18px]" />
              Back
            </Link>
          }
          center={<StepSegments current={2} />}
          right={
            <button
              onClick={() => {
                writeApplySession({
                  selectedCvId,
                  jobTitle,
                  companyName,
                  jobDescription,
                });
                router.push("/apply/step3");
              }}
              className="primary-button rounded-full px-6"
            >
              Next
              <Icon name="arrow_forward" className="text-[18px]" />
            </button>
          }
        />
      }
    >
      <div className="space-y-6">
        <SurfaceCard className="rounded-[1.6rem] bg-[var(--surface-container-high)] p-5 hover:bg-[var(--surface-container-high)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--secondary)]">Selected Base CV</div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-white">{selectedCvLabel}</div>
              <div className="mt-1 text-sm text-[var(--on-surface-variant)]">
                Step 1 stored this CV in session storage for the rest of the wizard.
              </div>
            </div>
            <Link href="/apply/step1" className="secondary-button rounded-full px-4 py-2">
              Change
            </Link>
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
              <h2 className="mt-5 font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--on-surface-variant)]">{card.text}</p>
            </SurfaceCard>
          ))}
        </div>
      </div>
    </WizardShell>
      <MobileNav />
    </>
  );
}
