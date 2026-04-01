import Link from "next/link";
import { redirect } from "next/navigation";
import MobileFAB from "@/components/MobileFAB";
import MobileNav from "@/components/MobileNav";
import { getServerUser } from "@/lib/get-server-user";
import { AppLogo, Icon, SectionTitle, SurfaceCard } from "@/components/redesign/ui";

const navItems = ["Features", "Pricing", "Resources"];

const featureCards = [
  {
    icon: "magic_button",
    title: "AI Tailoring",
    description:
      "Blend your strongest experience with the brief in seconds, then tune the tone before you send.",
  },
  {
    icon: "track_changes",
    title: "Track Every App",
    description:
      "Keep every role, status update, and follow-up reminder in a single operating view.",
  },
  {
    icon: "download_done",
    title: "One-Click Export",
    description:
      "Move from draft to polished CV or Google Doc export without rebuilding your document stack.",
  },
] as const;

const blueprintStyle = {
  backgroundImage: "radial-gradient(#1f2b49 1px, transparent 1px)",
  backgroundSize: "32px 32px",
};

const trustedBy = ["Notion", "Stripe", "Shopify", "Vercel", "Linear"];

const footerGroups = [
  {
    title: "Product",
    links: ["AI Tailoring", "Application Tracker", "CV Library"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Contact"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Security"],
  },
] as const;

export default async function HomePage() {
  const user = await getServerUser();
  if (user) {
    redirect("/shell");
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--on-surface)]">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_top_center,rgba(129,236,255,0.18),transparent_38rem)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(31,43,73,0.6)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="min-w-fit">
            <AppLogo title="Just a Job" subtitle="CV Tailor" compact />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item}
                href="#"
                className="text-sm font-medium text-[var(--on-surface-variant)] transition hover:text-[var(--on-surface)]"
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--on-surface-variant)] transition hover:bg-white/5 hover:text-[var(--on-surface)]"
            >
              Sign In
            </Link>
            <Link
              href="/apply/step1"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dim)] px-5 py-3 text-sm font-semibold text-[var(--on-primary)] shadow-[0_18px_40px_rgba(0,29,78,0.24)] transition hover:brightness-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="relative" style={blueprintStyle}>
          <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 pb-20 pt-18 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(25,37,64,0.7)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--primary)]">
                <Icon name="architecture" className="text-[16px]" />
                AI Application System
              </div>
              <h1 className="mt-8 font-headline text-5xl font-extrabold tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
                Your Dream Job, Architected by AI.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[var(--on-surface-variant)] sm:text-lg">
                Stitch together your strongest experience, tailor every CV to the brief, and run your job search
                like a deliberate system instead of a pile of tabs.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/apply/step1" className="primary-button min-w-[190px] rounded-full">
                  <Icon name="auto_awesome" className="text-[18px]" />
                  Start Tailoring
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex min-w-[190px] items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-[var(--on-surface)] transition hover:bg-white/10"
                >
                  <Icon name="play_circle" className="text-[18px]" />
                  View Demo Dashboard
                </Link>
              </div>
            </div>

            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-[2rem] border border-white/8 bg-[rgba(9,19,40,0.78)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl lg:p-8">
              <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[1.75rem] bg-[linear-gradient(145deg,rgba(20,31,56,0.92),rgba(9,19,40,0.78))] p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--secondary)]">
                        Tailor Flow
                      </div>
                      <div className="mt-2 font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">
                        Architecture for every application
                      </div>
                    </div>
                    <div className="rounded-full bg-[rgba(129,236,255,0.12)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                      Match +88%
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "Base CV", icon: "description" },
                      { label: "Job Brief", icon: "business_center" },
                      { label: "Tailored Draft", icon: "task_alt" },
                    ].map((item, index) => (
                      <div key={item.label} className="rounded-[1.4rem] bg-white/5 p-4">
                        <div className="flex items-center gap-3 text-sm font-semibold text-white">
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(129,236,255,0.12)] text-[var(--primary)]">
                            <Icon name={item.icon} className="text-[20px]" />
                          </span>
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--on-surface-variant)]">
                              Step {index + 1}
                            </div>
                            {item.label}
                          </div>
                        </div>
                        <div className="mt-4 h-2 rounded-full bg-white/8">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dim)]"
                            style={{ width: `${72 + index * 8}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.75rem] bg-[rgba(25,37,64,0.7)] p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]/80">
                        Active Roles
                      </div>
                      <div className="mt-2 font-headline text-3xl font-extrabold tracking-[-0.05em] text-white">24</div>
                    </div>
                    <div className="rounded-full bg-[rgba(110,155,255,0.14)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--secondary)]">
                      3 interviewing
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {[
                      ["Senior PM", "Applied", "91%"],
                      ["Platform Lead", "Interview", "87%"],
                      ["AI Product Mgr", "Offer", "94%"],
                    ].map(([role, stage, score]) => (
                      <div key={role} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                        <div>
                          <div className="font-semibold text-white">{role}</div>
                          <div className="text-sm text-[var(--on-surface-variant)]">{stage}</div>
                        </div>
                        <div className="rounded-full bg-[rgba(129,236,255,0.12)] px-3 py-1.5 text-xs font-semibold text-[var(--primary)]">
                          {score}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/8 pt-6 text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-[var(--on-surface-variant)]">
                  Trusted by candidates at
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold uppercase tracking-[0.28em] text-white/58 sm:text-base">
                  {trustedBy.map((brand) => (
                    <span key={brand}>{brand}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionTitle
            align="center"
            eyebrow="Capabilities"
            title="Everything needed to run a higher-signal job search"
            description="The core system stays simple: tailor the story, track the process, and export polished assets without losing momentum."
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {featureCards.map((card) => (
              <SurfaceCard
                key={card.title}
                className="group rounded-[1.75rem] bg-[var(--surface-container-high)] px-7 py-8 text-center hover:bg-[var(--surface-container-highest)]"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[rgba(129,236,255,0.12)] text-[var(--primary)] transition group-hover:scale-105">
                  <Icon name={card.icon} className="text-[30px]" />
                </div>
                <h3 className="mt-6 font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">{card.title}</h3>
                <p className="mt-4 text-base leading-7 text-[var(--on-surface-variant)]">{card.description}</p>
              </SurfaceCard>
            ))}
          </div>
        </section>

        <section className="relative py-20" style={blueprintStyle}>
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="space-y-8">
              <SectionTitle
                eyebrow="Guided Workflow"
                title="A tailoring wizard built for momentum"
                description="Each step narrows the problem: pick the right base, provide the brief, then let the system synthesize the strongest possible version."
              />

              <div className="space-y-4">
                {[
                  ["01", "Choose your foundation", "Select the CV template with the right story structure for the opportunity."],
                  ["02", "Paste the role requirements", "Drop in the job description and company context so the AI works against the real brief."],
                  ["03", "Review the tailored draft", "Inspect the match score, highlighted keywords, and export when it reads like your best work."],
                ].map(([step, title, description]) => (
                  <div key={step} className="rounded-[1.5rem] border border-white/8 bg-[rgba(9,19,40,0.8)] p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(129,236,255,0.12)] font-headline text-sm font-extrabold tracking-[0.1em] text-[var(--primary)]">
                        {step}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{title}</h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--on-surface-variant)]">{description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative rounded-[2rem] border border-white/8 bg-[rgba(9,19,40,0.88)] p-6 shadow-[0_28px_70px_rgba(0,0,0,0.22)]">
              <div className="absolute right-6 top-6 rounded-full bg-[rgba(129,236,255,0.16)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--primary)] shadow-[0_12px_30px_rgba(129,236,255,0.12)]">
                Synthesizing...
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                <div className="rounded-[1.6rem] bg-[rgba(255,255,255,0.96)] p-4 text-[#101621]">
                  <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">CV Preview</div>
                      <div className="mt-1 font-headline text-xl font-extrabold">Executive Strategy Lead</div>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">v4.2</div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">Impact Summary</div>
                      <div className="mt-2 h-2 w-full rounded-full bg-slate-200" />
                      <div className="mt-2 h-2 w-11/12 rounded-full bg-slate-200" />
                      <div className="mt-2 h-2 w-9/12 rounded-full bg-slate-200" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-700">Core Projects</div>
                      <div className="mt-2 rounded-xl bg-[rgba(0,212,236,0.12)] px-3 py-2 text-sm text-slate-700">
                        API platform roadmap aligned to multi-region growth
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-slate-200" />
                      <div className="mt-2 h-2 w-10/12 rounded-full bg-slate-200" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-700">Leadership</div>
                      <div className="mt-2 h-2 w-full rounded-full bg-slate-200" />
                      <div className="mt-2 h-2 w-8/12 rounded-full bg-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.5rem] bg-[var(--surface-container-high)] p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--secondary)]">
                      Job Description
                    </div>
                    <div className="mt-3 rounded-[1.2rem] bg-[rgba(6,14,32,0.72)] p-4 text-sm leading-6 text-[var(--on-surface-variant)]">
                      Looking for a product leader to orchestrate AI features, partner with engineering, and drive roadmap clarity across enterprise accounts...
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] bg-[var(--surface-container-high)] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--secondary)]">
                          AI Notes
                        </div>
                        <div className="mt-2 text-sm text-white">Matched roadmap leadership, enterprise delivery, API strategy.</div>
                      </div>
                      <Icon name="neurology" className="text-[30px] text-[var(--primary)]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#192540_0%,#060e20_100%)] px-6 py-12 shadow-[0_32px_80px_rgba(0,0,0,0.3)] sm:px-10 lg:px-14 lg:py-16">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--primary)]">
                  Ready to Ship Better Applications
                </div>
                <h2 className="mt-4 font-headline text-4xl font-extrabold tracking-[-0.05em] text-white sm:text-5xl">
                  Move from scattered drafts to a repeatable application engine.
                </h2>
                <p className="mt-4 text-base leading-7 text-[var(--on-surface-variant)] sm:text-lg">
                  Start with one base CV, tailor in minutes, and keep the whole search visible from first outreach to signed offer.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/apply/step1" className="primary-button rounded-full px-6">
                  Build My First CV
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Explore Tracker
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/8 bg-[rgba(6,14,32,0.9)]">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div className="space-y-4">
            <AppLogo title="Just a Job" subtitle="The Digital Tailor" />
            <p className="max-w-sm text-sm leading-6 text-[var(--on-surface-variant)]">
              AI-powered tailoring for people who want every application to feel considered, not mass-produced.
            </p>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white">{group.title}</div>
              <div className="mt-4 space-y-3 text-sm text-[var(--on-surface-variant)]">
                {group.links.map((link) => (
                  <Link key={link} href="#" className="block transition hover:text-white">
                    {link}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </footer>

      <MobileFAB />
      <MobileNav />
    </div>
  );
}
