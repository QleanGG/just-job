"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase-browser";

export default function DashboardPage() {
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
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <a href="/" className="flex items-center gap-3 text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-semibold">CV Tailor</span>
            </a>
            <nav className="hidden items-center gap-4 md:flex">
              <a href="/" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">New Application</a>
              <a href="/cvs" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">My CVs</a>
              <span className="text-sm font-medium text-[var(--color-accent)]">Applications</span>
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
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-4 pb-24 sm:px-6 sm:py-6 md:pb-6">
        <Dashboard
          onJobSelect={(job) => {
            window.location.href = `/?jobId=${encodeURIComponent(job.id)}&cvId=${encodeURIComponent(job.cv_id || "")}`;
          }}
        />
        <BottomNav />
      </main>
    </div>
  );
}
