import Link from "next/link";
import MobileNav from "@/components/MobileNav";
import { WizardBottomBar, WizardShell } from "@/components/redesign/wizard-shell";
import { Icon, MiniDocument, StepSegments, SurfaceCard } from "@/components/redesign/ui";

const cvCards = [
  {
    title: "Executive Strategy Lead",
    note: "Premium base · 12 versions",
    selected: false,
  },
  {
    title: "AI Product Manager",
    note: "Most recent tailored base",
    selected: true,
  },
] as const;

export default function ApplyStep1Page() {
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
            <Link href="/apply/step2" className="primary-button rounded-full px-6">
              Next
              <Icon name="arrow_forward" className="text-[18px]" />
            </Link>
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

        {cvCards.map((card) => (
          <SurfaceCard
            key={card.title}
            className={[
              "relative rounded-[1.75rem] bg-[var(--surface-container-high)] p-5 hover:bg-[var(--surface-container-highest)]",
              card.selected ? "ring-2 ring-[var(--primary)] shadow-[0_0_0_1px_rgba(129,236,255,0.12)]" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {card.selected ? (
              <div className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(129,236,255,0.16)] text-[var(--primary)]">
                <Icon name="check_circle" fill className="text-[22px]" />
              </div>
            ) : null}
            <MiniDocument title={card.title} />
            <div className="mt-5">
              <h3 className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">{card.title}</h3>
              <p className="mt-2 text-sm text-[var(--on-surface-variant)]">{card.note}</p>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </WizardShell>
      <MobileNav />
    </>
  );
}
