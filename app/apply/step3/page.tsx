import Link from "next/link";
import MobileNav from "@/components/MobileNav";
import { WizardBottomBar, WizardShell } from "@/components/redesign/wizard-shell";
import { Icon, StepSegments, SurfaceCard } from "@/components/redesign/ui";

const competencies = [
  ["Platform Strategy", "Direct match"],
  ["AI Product Operations", "High signal"],
  ["Enterprise Delivery", "Mentioned 4x"],
  ["Developer Tooling", "Strong overlap"],
] as const;

export default function ApplyStep3Page() {
  return (
    <>
      <WizardShell
      step={3}
      title="AI Tailoring"
      description="Review the match analysis, inspect the draft, and decide whether to regenerate or move forward with this version."
      bottomBar={
        <WizardBottomBar
          left={
            <button type="button" className="secondary-button rounded-full px-6 py-3">
              <Icon name="autorenew" className="text-[18px]" />
              Regenerate
            </button>
          }
          center={<StepSegments current={3} />}
          right={
            <>
              <button type="button" className="secondary-button rounded-full px-6 py-3">
                Save as Draft
              </button>
              <Link href="/apply/step4" className="primary-button rounded-full px-6">
                Accept &amp; Continue
                <Icon name="arrow_forward" className="text-[18px]" />
              </Link>
            </>
          }
        />
      }
    >
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-4">
          <SurfaceCard className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-6 hover:bg-[var(--surface-container-high)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--secondary)]">Match score</div>
            <div className="mt-5 font-headline text-6xl font-extrabold tracking-[-0.06em] text-white">85%</div>
            <p className="mt-3 text-sm leading-6 text-[var(--on-surface-variant)]">
              Strong alignment on AI roadmap leadership, enterprise collaboration, and technical product depth.
            </p>
          </SurfaceCard>

          <SurfaceCard className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-6 hover:bg-[var(--surface-container-highest)]">
            <h2 className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">Matched Competencies</h2>
            <div className="mt-5 space-y-4">
              {competencies.map(([skill, badge]) => (
                <div key={skill} className="flex items-center justify-between gap-3 rounded-[1.2rem] bg-[rgba(9,19,40,0.6)] px-4 py-3">
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
              <span className="text-sm font-semibold uppercase tracking-[0.22em]">AI Tailor&apos;s Note</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--on-surface)]">
              I elevated your work with API programs and enterprise discovery because the brief repeatedly centers platform adoption, technical alignment, and roadmap ownership.
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
                  <div className="mt-1 font-semibold text-white">Executive Strategy Lead · Tailored Draft</div>
                </div>
                <span className="rounded-full bg-[rgba(129,236,255,0.14)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                  Optimized
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="glass-panel flex h-10 w-10 items-center justify-center rounded-full text-[var(--on-surface-variant)] transition hover:text-white">
                  <Icon name="zoom_in" className="text-[18px]" />
                </button>
                <button type="button" className="glass-panel flex h-10 w-10 items-center justify-center rounded-full text-[var(--on-surface-variant)] transition hover:text-white">
                  <Icon name="download" className="text-[18px]" />
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-[1.6rem] bg-[rgba(6,14,32,0.72)] p-5">
              <div className="mx-auto max-w-3xl rounded-[1.75rem] bg-white p-8 text-[#101621] shadow-[0_24px_50px_rgba(16,22,33,0.12)]">
                <div className="space-y-2 border-b border-slate-200 pb-5">
                  <div className="font-headline text-3xl font-extrabold tracking-[-0.05em]">Guy Guzman</div>
                  <div className="text-sm text-slate-600">Product Manager · AI Platforms · Enterprise Systems</div>
                </div>

                <div className="mt-6 space-y-6 text-sm leading-7 text-slate-700">
                  <section>
                    <div className="font-semibold uppercase tracking-[0.18em] text-slate-500">Profile</div>
                    <p className="mt-3">
                      Technical product manager with a record of leading
                      <span className="border-b border-[var(--primary)] bg-[var(--primary)]/20 px-1"> AI platform roadmaps</span>,
                      enterprise programs, and data-heavy initiatives across cross-functional teams.
                    </p>
                  </section>

                  <section>
                    <div className="font-semibold uppercase tracking-[0.18em] text-slate-500">Recent Impact</div>
                    <ul className="mt-3 space-y-3 pl-5">
                      <li>
                        Directed a
                        <span className="border-b border-[var(--primary)] bg-[var(--primary)]/20 px-1"> developer tooling strategy</span>
                        that improved adoption and reduced integration ambiguity for strategic accounts.
                      </li>
                      <li>
                        Built feedback loops between customers, GTM, and engineering to keep
                        <span className="border-b border-[var(--primary)] bg-[var(--primary)]/20 px-1"> enterprise delivery</span>
                        aligned with roadmap priorities.
                      </li>
                      <li>
                        Converted discovery into prioritization frameworks for
                        <span className="border-b border-[var(--primary)] bg-[var(--primary)]/20 px-1"> applied AI experiences</span>
                        shipped to high-volume users.
                      </li>
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WizardShell>
      <MobileNav />
    </>
  );
}
