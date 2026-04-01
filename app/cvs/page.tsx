import MobileHeader from "@/components/MobileHeader";
import MobileNav from "@/components/MobileNav";
import { Sidebar } from "@/components/redesign/sidebar";
import { TopBar } from "@/components/redesign/topbar";
import { Icon, MiniDocument, SurfaceCard } from "@/components/redesign/ui";

const templates = [
  {
    title: "Executive Strategy Lead",
    date: "Updated Mar 29, 2026",
    versions: "12 versions",
    active: true,
  },
  {
    title: "UX Engineering Spec",
    date: "Updated Mar 26, 2026",
    versions: "4 versions",
  },
  {
    title: "Freelance Consultant",
    date: "Updated Mar 18, 2026",
    versions: "7 versions",
  },
] as const;

const archiveRows = [
  ["Product Systems CV", "Mar 12, 2026", "Archived", "Restore"],
  ["Growth PM Draft", "Feb 28, 2026", "Archived", "Duplicate"],
  ["Platform Operations CV", "Feb 07, 2026", "Version Locked", "Preview"],
] as const;

function GoogleMark() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#4285F4]">
      G
    </span>
  );
}

export default function CvsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--on-surface)]">
      <Sidebar active="cvs" />
      <MobileHeader />

      <div className="relative min-h-screen lg:pl-64">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_top_left,rgba(110,155,255,0.14),transparent_34rem)]" />
        <TopBar searchPlaceholder="Search templates, versions, notes" />

        <main className="relative px-4 pb-10 pt-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-10">
            <section className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--secondary)]">
                  CV Library
                </div>
                <h1 className="mt-3 font-headline text-4xl font-extrabold tracking-[-0.05em] text-white sm:text-5xl">
                  My CVs
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--on-surface-variant)]">
                  Organize your base templates, keep alternate positioning stories ready, and export tailored versions when a role is worth it.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[rgba(25,37,64,0.7)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(25,37,64,0.92)]"
                >
                  <Icon name="cloud_upload" className="text-[18px] text-[var(--primary)]" />
                  Upload CV
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[rgba(25,37,64,0.7)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(25,37,64,0.92)]"
                >
                  <GoogleMark />
                  Google Docs
                </button>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-3">
              <SurfaceCard className="rounded-[1.9rem] bg-[linear-gradient(145deg,rgba(20,31,56,0.96),rgba(25,37,64,0.88))] p-6 hover:bg-[linear-gradient(145deg,rgba(20,31,56,0.96),rgba(25,37,64,0.88))] xl:col-span-2">
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                  <div className="rounded-[1.6rem] bg-[rgba(9,19,40,0.5)] p-4">
                    <MiniDocument title={templates[0].title} className="shadow-[0_20px_48px_rgba(0,0,0,0.12)]" />
                  </div>

                  <div>
                    <span className="inline-flex items-center rounded-full bg-[rgba(129,236,255,0.14)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                      Active Base
                    </span>
                    <h2 className="mt-5 font-headline text-3xl font-extrabold tracking-[-0.05em] text-white sm:text-4xl">
                      {templates[0].title}
                    </h2>
                    <p className="mt-3 text-sm text-[var(--on-surface-variant)]">
                      {templates[0].date} · {templates[0].versions}
                    </p>
                    <p className="mt-4 text-base leading-7 text-[var(--on-surface-variant)]">
                      Primary leadership template for strategy-heavy roles, with strong emphasis on platform execution, AI programs, and enterprise delivery.
                    </p>
                    <button type="button" className="primary-button mt-8 rounded-full px-6">
                      <Icon name="edit_square" className="text-[18px]" />
                      Edit Template
                    </button>
                  </div>
                </div>
              </SurfaceCard>

              {templates.slice(1).map((template) => (
                <SurfaceCard
                  key={template.title}
                  className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-5 hover:bg-[var(--surface-container-highest)]"
                >
                  <MiniDocument title={template.title} accent="secondary" />
                  <div className="mt-5">
                    <h3 className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">{template.title}</h3>
                    <p className="mt-2 text-sm text-[var(--on-surface-variant)]">
                      {template.date} · {template.versions}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-6 inline-flex items-center justify-center rounded-full bg-[rgba(110,155,255,0.14)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--secondary)] transition hover:bg-[rgba(110,155,255,0.22)]"
                  >
                    Set Base
                  </button>
                </SurfaceCard>
              ))}

              <div className="flex min-h-[22rem] items-center justify-center rounded-[1.75rem] border border-dashed border-white/15 bg-[rgba(9,19,40,0.5)] p-6 text-center xl:col-span-1">
                <div className="max-w-xs">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[rgba(129,236,255,0.12)] text-[var(--primary)]">
                    <Icon name="add" className="text-[30px]" />
                  </div>
                  <h3 className="mt-5 font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">Create Empty Template</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--on-surface-variant)]">
                    Start from a blank canvas when you need a new story architecture for a different role family.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[1.9rem] bg-[var(--surface-container-high)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.16)]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">CV Archive &amp; History</h2>
                  <p className="mt-2 text-sm text-[var(--on-surface-variant)]">
                    Older versions stay available for auditing, reuse, or restoring a past narrative.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex rounded-full bg-[rgba(25,37,64,0.78)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)] transition hover:bg-[rgba(25,37,64,0.94)]"
                >
                  View all history
                </button>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/8 text-[11px] uppercase tracking-[0.24em] text-[var(--on-surface-variant)]">
                      <th className="pb-4 font-semibold">Template Name</th>
                      <th className="pb-4 font-semibold">Last Modified</th>
                      <th className="pb-4 font-semibold">Status</th>
                      <th className="pb-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archiveRows.map(([name, date, status, action]) => (
                      <tr key={name} className="border-b border-white/6 last:border-b-0">
                        <td className="py-4 pr-4 font-medium text-white">{name}</td>
                        <td className="py-4 pr-4 text-[var(--on-surface-variant)]">{date}</td>
                        <td className="py-4 pr-4">
                          <span className="inline-flex rounded-full bg-[rgba(25,37,64,0.72)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--secondary)]">
                            {status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button type="button" className="font-semibold text-[var(--primary)] transition hover:text-white">
                            {action}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
