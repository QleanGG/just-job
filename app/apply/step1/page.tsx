"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MobileNav from "@/components/MobileNav";
import { WizardBottomBar, WizardShell } from "@/components/redesign/wizard-shell";
import { Icon, MiniDocument, StepSegments, SurfaceCard } from "@/components/redesign/ui";
import { useCVs } from "@/hooks/useCVs";
import { writeApplySession } from "@/lib/apply-session";

export default function ApplyStep1Page() {
  const { data: cvs, isLoading } = useCVs();
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const router = useRouter();

  const activeCv = cvs?.find((cv) => cv.is_preset) || cvs?.[0];

  useEffect(() => {
    if (!selectedCvId && activeCv?.id) {
      setSelectedCvId(activeCv.id);
    }
  }, [activeCv?.id, selectedCvId]);

  return (
    <>
      <WizardShell
      step={1}
      title="Choose Your CV"
      description="Start with the base that best matches the story you want to sharpen for this role."
      bottomBar={
        <WizardBottomBar
          left={
            <Link href="/" className="inline-flex rounded-full px-4 py-2 text-sm font-semibold text-[var(--on-surface-variant)] transition hover:text-white">
              Cancel
            </Link>
          }
          center={<StepSegments current={1} />}
          right={
            <button
              onClick={() => {
                if (selectedCvId) {
                  writeApplySession({
                    selectedCvId,
                    acceptedAt: null,
                  });
                }
                router.push("/apply/step2");
              }}
              disabled={!selectedCvId}
              className="primary-button rounded-full px-6 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <Icon name="arrow_forward" className="text-[18px]" />
            </button>
          }
        />
      }
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex min-h-[24rem] items-center justify-center rounded-[1.75rem] border border-dashed border-white/15 bg-[rgba(9,19,40,0.45)] p-6 text-center">
          <div className="max-w-xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[rgba(129,236,255,0.12)] text-[var(--primary)]">
              <Icon name="add" className="text-[30px]" />
            </div>
            <h2 className="mt-5 font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">Add New CV</h2>
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
            <div className="mt-3 text-sm font-semibold text-white">{cv.display_name || cv.name || "Untitled"}</div>
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
    </WizardShell>
      <MobileNav />
    </>
  );
}
