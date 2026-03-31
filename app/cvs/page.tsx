"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CvsView from "@/components/CvsView";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase-browser";

export default function CvsPage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a
            href="/"
            className="flex items-center gap-3 text-[var(--color-text)] transition-colors hover:text-[var(--color-accent)]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)]">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"
                />
              </svg>
            </div>
            <span className="font-semibold">CV Tailor</span>
          </a>

          <nav className="hidden items-center gap-4 text-sm md:flex">
            <a
              href="/"
              className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              New Application
            </a>
            <a
              href="/dashboard"
              className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              Applications
            </a>
            <span className="font-medium text-[var(--color-accent)]">My CVs</span>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-5 pb-24 sm:px-6 sm:py-6 md:pb-6 lg:px-8">
        <CvsView key={refreshKey} onRefresh={() => setRefreshKey((k) => k + 1)} />
        <BottomNav />
      </main>
    </div>
  );
}
