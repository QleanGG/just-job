"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";
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

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
    } catch {
      setError("Unable to sign in with Google");
    } finally {
      setLoading(false);
    }
  }

  async function handleLinkedInSignIn() {
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "linkedin",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
    } catch {
      setError("Unable to sign in with LinkedIn");
    } finally {
      setLoading(false);
    }
  }

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

      toast.success("Welcome back! Ready to tailor your next opportunity.");
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
            {/* Social Sign In */}
            <div className="space-y-3">
              <button
                type="button"
                className="group relative flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 text-[15px] font-semibold text-gray-700 shadow-[0_4px_20px_rgba(0,0,0,0.18)] transition-all hover:bg-gray-50 hover:shadow-[0_6px_28px_rgba(0,0,0,0.24)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] focus-visible:ring-[var(--primary)]"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                {/* Spinner overlay when loading */}
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  </div>
                ) : (
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span className={loading ? "invisible" : ""}>Continue with Google</span>
              </button>

              <button
                type="button"
                className="group relative flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[#0A66C2]/30 bg-[#0A66C2] px-5 text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(10,102,194,0.28)] transition-all hover:bg-[#0077B5] hover:shadow-[0_6px_24px_rgba(10,102,194,0.4)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] focus-visible:ring-[#0A66C2]"
                onClick={handleLinkedInSignIn}
                disabled={loading}
              >
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#0A66C2]">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  </div>
                ) : (
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                  </svg>
                )}
                <span className={loading ? "invisible" : ""}>Continue with LinkedIn</span>
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
