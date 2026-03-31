"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Wizard, { WizardProvider } from "@/components/Wizard";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase-browser";

export default function Home() {
  const router = useRouter();
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
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-3 text-[var(--color-text)] transition-colors hover:text-[var(--color-accent)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)]">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-semibold">CV Tailor</span>
          </a>
          <nav className="hidden items-center gap-4 md:flex">
            <span className="text-sm font-medium text-[var(--color-accent)]">New Application</span>
            <a href="/dashboard" className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]">
              Applications
            </a>
            <a href="/cvs" className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]">
              My CVs
            </a>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 pb-24 sm:px-6 md:py-8 md:pb-8">
        <WizardProvider>
          <Wizard />
        </WizardProvider>
        <BottomNav />
      </main>
    </div>
  );
}
