"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import MobileHeader from "@/components/MobileHeader";
import MobileNav from "@/components/MobileNav";
import { Sidebar } from "@/components/redesign/sidebar";
import { SurfaceCard } from "@/components/redesign/ui";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; full_name?: string; avatar_url?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user as { email?: string; full_name?: string; avatar_url?: string } | null);
      setLoading(false);
    });
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "??";

  const displayName = user?.full_name || user?.email || "Your Profile";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--on-surface)]">
      <Sidebar active="settings" />

      <div className="relative min-h-screen lg:pl-64">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_top_left,rgba(129,236,255,0.08),transparent_34rem)]" />

        <div className="px-4 pb-10 pt-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-8">
            {/* Page Header */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--secondary)]">
                Account
              </div>
              <h1 className="mt-3 font-headline text-4xl font-extrabold tracking-[-0.05em] text-white sm:text-5xl">
                Profile
              </h1>
              <p className="mt-3 text-base leading-7 text-[var(--on-surface-variant)]">
                Manage your account settings and preferences.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
              </div>
            ) : (
              <>
                {/* User Card */}
                <SurfaceCard className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-8">
                  <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[rgba(129,236,255,0.12)] text-[var(--primary)] font-headline text-2xl font-extrabold">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">
                        {displayName}
                      </div>
                      {user?.email && (
                        <div className="mt-1 truncate text-sm text-[var(--on-surface-variant)]">
                          {user.email}
                        </div>
                      )}
                    </div>
                  </div>
                </SurfaceCard>

                {/* Settings List */}
                <SurfaceCard className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-2">
                  <div className="divide-y divide-white/6">
                    <button
                      type="button"
                      className="flex w-full items-center gap-4 rounded-[1.4rem] p-5 text-left transition hover:bg-[var(--surface-container-highest)]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(129,236,255,0.1)] text-[var(--primary)]">
                        <span className="material-symbols-outlined text-[22px]">person</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">Personal Information</div>
                        <div className="text-sm text-[var(--on-surface-variant)]">Update your name and email</div>
                      </div>
                      <span className="material-symbols-outlined text-[var(--on-surface-variant)]">chevron_right</span>
                    </button>

                    <button
                      type="button"
                      className="flex w-full items-center gap-4 rounded-[1.4rem] p-5 text-left transition hover:bg-[var(--surface-container-highest)]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(129,236,255,0.1)] text-[var(--primary)]">
                        <span className="material-symbols-outlined text-[22px]">notifications</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">Notifications</div>
                        <div className="text-sm text-[var(--on-surface-variant)]">Manage alerts and reminders</div>
                      </div>
                      <span className="material-symbols-outlined text-[var(--on-surface-variant)]">chevron_right</span>
                    </button>

                    <button
                      type="button"
                      className="flex w-full items-center gap-4 rounded-[1.4rem] p-5 text-left transition hover:bg-[var(--surface-container-highest)]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(129,236,255,0.1)] text-[var(--primary)]">
                        <span className="material-symbols-outlined text-[22px]">security</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">Security</div>
                        <div className="text-sm text-[var(--on-surface-variant)]">Password and authentication</div>
                      </div>
                      <span className="material-symbols-outlined text-[var(--on-surface-variant)]">chevron_right</span>
                    </button>
                  </div>
                </SurfaceCard>

                {/* Danger Zone */}
                <SurfaceCard className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-2">
                  <div className="divide-y divide-white/6">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="flex w-full items-center gap-4 rounded-[1.4rem] p-5 text-left transition hover:bg-[var(--error)]/10 disabled:opacity-60"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--error)]/10 text-[var(--error)]">
                        <span className="material-symbols-outlined text-[22px]">logout</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-[var(--error)]">
                          {signingOut ? "Signing out..." : "Sign Out"}
                        </div>
                        <div className="text-sm text-[var(--on-surface-variant)]">Log out of your account</div>
                      </div>
                      <span className="material-symbols-outlined text-[var(--error)]">chevron_right</span>
                    </button>
                  </div>
                </SurfaceCard>

                {/* Version info */}
                <div className="text-center text-xs text-[var(--on-surface-variant)]">
                  Just a Job · v1.0.0
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
