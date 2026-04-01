import Link from "next/link";
import MobileNav from "@/components/MobileNav";
import { WizardBottomBar, WizardShell } from "@/components/redesign/wizard-shell";
import { Icon, StepSegments, SurfaceCard } from "@/components/redesign/ui";

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
            <Link href="/apply/step3" className="primary-button rounded-full px-6">
              Next
              <Icon name="arrow_forward" className="text-[18px]" />
            </Link>
          }
        />
      }
    >
      <div className="space-y-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <label className="space-y-3">
            <span className="text-sm font-semibold text-white">Job Title</span>
            <input className="input-shell w-full" defaultValue="Senior Product Manager, AI Platform" type="text" />
          </label>
          <label className="space-y-3">
            <span className="text-sm font-semibold text-white">Company Name</span>
            <input className="input-shell w-full" defaultValue="Northstar Systems" type="text" />
          </label>
        </div>

        <label className="block space-y-3">
          <span className="text-sm font-semibold text-white">Job Description</span>
          <textarea
            className="input-shell min-h-[350px] w-full resize-none leading-7"
            defaultValue="We are looking for a product leader to drive our AI platform roadmap, partner deeply with engineering, and turn enterprise customer feedback into durable product bets. You will work across data infrastructure, developer tooling, and applied AI experiences while aligning internal stakeholders around a clear operating plan."
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
