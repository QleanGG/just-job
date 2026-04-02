import Link from "next/link";
import MobileFAB from "@/components/MobileFAB";
import MobileNav from "@/components/MobileNav";
import { AppLogo, Icon } from "@/components/redesign/ui";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--background)] px-6 text-center">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)]/6 blur-[100px]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(#1f2b49 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* 404 graphic */}
        <div className="relative">
          <div className="flex h-40 w-40 items-center justify-center rounded-full bg-[var(--surface-container-high)]">
            <span className="font-headline text-7xl font-black tracking-tighter text-[var(--primary)]">404</span>
          </div>
          {/* Orbiting icon */}
          <div className="absolute -right-4 -top-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-container-highest)] shadow-lg">
            <span className="material-symbols-outlined text-2xl text-[var(--secondary)]">search_off</span>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-4">
          <h1 className="font-headline text-4xl font-extrabold tracking-[-0.04em] text-white sm:text-5xl">
            Page not found
          </h1>
          <p className="max-w-sm text-base leading-7 text-[var(--on-surface-variant)]">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="primary-button inline-flex items-center justify-center gap-2 rounded-full px-8"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Back to Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            Dashboard
          </Link>
        </div>
      </div>

      <MobileFAB />
      <MobileNav />
    </div>
  );
}
