import type { ReactNode } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/redesign/sidebar";
import { AppLogo, StepSegments, cn } from "@/components/redesign/ui";

type SidebarActive = "dashboard" | "cvs" | "settings" | "cta";

export function WizardShell({
  step,
  title,
  description,
  children,
  bottomBar,
  sidebarActive = "cta",
}: {
  step: number;
  title: string;
  description: string;
  children: ReactNode;
  bottomBar: ReactNode;
  sidebarActive?: SidebarActive;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar active={sidebarActive} />

      <div className="relative min-h-screen lg:pl-64">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top_right,rgba(129,236,255,0.12),transparent_34rem)]" />
        <div className="pointer-events-none absolute inset-0 blueprint-grid opacity-55" />

        <header className="glass-panel sticky top-0 z-20 border-b border-[rgba(64,72,93,0.15)] lg:hidden">
          <div className="mx-auto flex h-16 items-center px-4">
            <Link href="/">
              <AppLogo compact />
            </Link>
          </div>
        </header>

        <main className="relative mx-auto max-w-7xl px-4 pb-32 pt-8 sm:px-6 lg:px-10 lg:pt-14">
          <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--secondary)]">
                Step {step} of 4
              </div>
              <h1 className="font-headline text-4xl font-extrabold tracking-[-0.05em] text-[var(--on-surface)] sm:text-5xl">
                {title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--on-surface-variant)] sm:text-lg">
                {description}
              </p>
            </div>
            <StepSegments current={step} />
          </div>

          {children}
        </main>

        {bottomBar}
      </div>
    </div>
  );
}

export function WizardBottomBar({
  left,
  center,
  right,
  className,
}: {
  left: ReactNode;
  center?: ReactNode;
  right: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass-panel fixed bottom-0 left-0 right-0 z-30 border-t border-[rgba(64,72,93,0.15)] px-4 py-4 lg:left-64 sm:px-6 lg:px-8",
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="flex items-center justify-center sm:justify-start">{left}</div>
        <div className="flex items-center justify-center">{center}</div>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">{right}</div>
      </div>
    </div>
  );
}
