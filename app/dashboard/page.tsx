import MobileFAB from "@/components/MobileFAB";
import MobileHeader from "@/components/MobileHeader";
import MobileNav from "@/components/MobileNav";
import { Sidebar } from "@/components/redesign/sidebar";
import { TopBar } from "@/components/redesign/topbar";
import { Icon, MatchRing, StatusPill, SurfaceCard } from "@/components/redesign/ui";

const stats = [
  { label: "Total Outreach", value: "24", hint: "+6 this week" },
  { label: "Interviewing", value: "3", hint: "2 scheduled this week" },
  { label: "Offers Made", value: "1", hint: "Stripe, Product Strategy" },
  { label: "Average Match", value: "88%", hint: "Across active applications" },
] as const;

const applications = [
  {
    icon: "payments",
    role: "Senior Product Strategist",
    company: "Stripe",
    location: "Remote · London",
    cv: "CV v4.2",
    match: 94,
    status: "Offer" as const,
    emphasized: true,
    faded: false,
  },
  {
    icon: "account_balance",
    role: "Platform Product Lead",
    company: "Fintech Global",
    location: "Tel Aviv · Hybrid",
    cv: "CV v3.8",
    match: 89,
    status: "Interview" as const,
    emphasized: false,
    faded: false,
  },
  {
    icon: "design_services",
    role: "Design Systems Product Manager",
    company: "Design Systems Inc",
    location: "Berlin · Remote",
    cv: "CV v2.4",
    match: 86,
    status: "Applied" as const,
    emphasized: false,
    faded: false,
  },
  {
    icon: "currency_bitcoin",
    role: "Growth PM, Ecosystem",
    company: "CryptoLayer",
    location: "Remote · Global",
    cv: "CV v1.7",
    match: 72,
    status: "Rejected" as const,
    emphasized: false,
    faded: true,
  },
] as const;

export default function DashboardPage() {
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
                  17 active applications across tailored drafts, interviews, and one live offer this cycle.
                </p>
              </div>

              <div className="rounded-[1.4rem] bg-[rgba(25,37,64,0.65)] px-5 py-4 text-sm text-[var(--on-surface-variant)] shadow-[0_18px_40px_rgba(0,0,0,0.14)]">
                Most active lane: <span className="font-semibold text-white">Interview pipeline</span>
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

              <div className="grid gap-5 xl:grid-cols-2">
                {applications.map((application) => (
                  <SurfaceCard
                    key={application.company}
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
                              {application.cv}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[var(--on-surface-variant)]">
                            {application.company} · {application.location}
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
                        <MatchRing value={application.match} size={78} />
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--on-surface-variant)]">
                            Match score
                          </div>
                          <div className="mt-2 text-sm text-[var(--on-surface-variant)]">
                            Tuned to emphasize roadmap ownership, technical fluency, and hiring-panel language.
                          </div>
                        </div>
                      </div>

                      <StatusPill status={application.status} />
                    </div>
                  </SurfaceCard>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>

      <MobileFAB />
      <MobileNav />
    </div>
  );
}
