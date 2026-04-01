"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

function getSafeRedirectTarget(from: string | null) {
  if (
    !from ||
    !from.startsWith("/") ||
    from.startsWith("//") ||
    from.startsWith("/login") ||
    from.startsWith("/auth")
  ) {
    return "/";
  }

  return from;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = getSafeRedirectTarget(searchParams.get("from"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace(from);
      } else {
        setCheckingSession(false);
      }
    });
  }, [router, from]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push(from);
      router.refresh();
    } catch {
      setError("Unable to sign in right now");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] px-4 py-10 text-[var(--on-surface)] sm:px-6">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute right-[-8rem] top-[-7rem] h-72 w-72 rounded-full bg-[var(--primary)]/10 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
        <div className="absolute bottom-[-8rem] left-[-6rem] h-64 w-64 rounded-full bg-[var(--secondary)]/10 blur-3xl sm:h-[24rem] sm:w-[24rem]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-sm items-center justify-center">
        <div className="w-full">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-container-highest)] shadow-[0_24px_50px_rgba(0,0,0,0.24)]">
              <span className="material-symbols-outlined text-4xl text-[var(--primary)]">work</span>
            </div>
            <h1 className="font-headline text-3xl font-extrabold uppercase tracking-[-0.05em] text-[var(--on-surface)]">
              Just a Job
            </h1>
            <p className="mt-2 text-sm tracking-[0.03em] text-[var(--on-surface-variant)]">
              Enter your credentials to continue your journey.
            </p>
          </div>

          <div className="space-y-8 rounded-[2rem] border border-white/8 bg-[rgba(15,25,48,0.72)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.32)] backdrop-blur">
            <div className="grid grid-cols-1 gap-4">
              <button
                type="button"
                className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-white/8 bg-[var(--surface-container-high)] px-5 text-sm font-semibold text-[var(--on-surface)] transition hover:bg-[var(--surface-container-highest)]"
              >
                <span className="material-symbols-outlined text-[#EA4335]">google</span>
                Continue with Google
              </button>
              <button
                type="button"
                className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-white/8 bg-[var(--surface-container-high)] px-5 text-sm font-semibold text-[var(--on-surface)] transition hover:bg-[var(--surface-container-highest)]"
              >
                <span className="material-symbols-outlined text-[#0A66C2]">share</span>
                Continue with LinkedIn
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-bold uppercase tracking-[0.26em] text-[var(--on-surface-variant)]">or email</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="ml-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--on-surface-variant)]" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="alex@example.com"
                    required
                    autoFocus
                    className="h-14 w-full rounded-xl bg-[var(--surface-container-high)] px-12 text-base text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  />
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[var(--on-surface-variant)]">
                    alternate_email
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="ml-1 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--on-surface-variant)]" htmlFor="password">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-14 w-full rounded-xl bg-[var(--surface-container-high)] px-12 text-base text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                  />
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[var(--on-surface-variant)]">
                    lock_open
                  </span>
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]"
                    aria-label="Toggle password visibility"
                  >
                    <span className="material-symbols-outlined text-xl">visibility</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--secondary)] transition hover:text-[var(--primary)]">
                  Forgot Password?
                </button>
              </div>

              {error ? <p className="text-sm text-[var(--error)]">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dim)] px-5 text-sm font-bold uppercase tracking-[0.18em] text-[var(--on-primary)] shadow-[0_10px_30px_rgba(129,236,255,0.2)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{loading ? "Signing In..." : "Sign In"}</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>

            <div className="pt-2 text-center text-sm text-[var(--on-surface-variant)]">
              New to the platform?
              <button type="button" className="ml-1 font-bold text-[var(--primary)] transition hover:underline">
                Create an Account
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--on-surface-variant)]/60">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)]" />}>
      <LoginPageContent />
    </Suspense>
  );
}
