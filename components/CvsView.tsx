"use client";

import { useEffect, useState } from "react";
import type { CV } from "@/lib/supabase";

type CvsViewProps = {
  cvs?: CV[];
  currentCvId?: string;
  onSelect?: (cv: CV) => void;
  onRefresh?: () => void;
  onDelete?: (id: string) => void;
};

type BusyAction = "activate" | "delete" | "";

const updatedAtFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function getCvName(cv: CV) {
  return cv.display_name || cv.name || "Untitled CV";
}

function getCvInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "CV";
  }

  return parts.map((part) => part[0]?.toUpperCase() || "").join("").slice(0, 2);
}

function getUrlLabel(docUrl: string) {
  try {
    const url = new URL(docUrl);
    return `${url.hostname}${url.pathname}`.replace(/\/$/, "");
  } catch {
    return docUrl;
  }
}

function isValidGoogleDocsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname === "docs.google.com" && url.pathname.includes("/document/d/");
  } catch {
    return false;
  }
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        className="opacity-20"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        className="opacity-90"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">
      <p className="min-w-0 flex-1">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10"
        aria-label="Dismiss error"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
}

function DocumentIcon({ initials, active }: { initials: string; active: boolean }) {
  return (
    <div
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold ${
        active
          ? "border-[color:rgba(129,140,248,0.45)] bg-[linear-gradient(180deg,rgba(129,140,248,0.28),rgba(99,102,241,0.12))] text-[var(--color-text)]"
          : "border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(63,63,70,0.45),rgba(24,24,27,1))] text-[var(--color-text-secondary)]"
      }`}
    >
      <span>{initials}</span>
    </div>
  );
}

export default function CvsView({
  cvs: controlledCvs,
  currentCvId = "",
  onSelect,
  onRefresh,
  onDelete,
}: CvsViewProps) {
  const [addingCvUrl, setAddingCvUrl] = useState("");
  const [busyId, setBusyId] = useState("");
  const [busyAction, setBusyAction] = useState<BusyAction>("");
  const [isAdding, setIsAdding] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(controlledCvs === undefined);
  const [internalCvs, setInternalCvs] = useState<CV[]>(controlledCvs || []);
  const [error, setError] = useState("");

  const cvs = controlledCvs ?? internalCvs;

  const fetchCvs = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/cv");
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to load CVs");
      }

      const data = (await res.json()) as CV[];
      setInternalCvs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CVs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (controlledCvs !== undefined) {
      setInternalCvs(controlledCvs);
      setIsLoading(false);
      return;
    }

    void fetchCvs();
  }, [controlledCvs]);

  const handleMakeActive = async (cv: CV) => {
    setBusyId(cv.id);
    setBusyAction("activate");
    setError("");

    try {
      const res = await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cv.id,
          name: cv.name || "CV",
          docUrl: cv.doc_url,
          parsedSections: cv.parsed_sections,
          isPreset: true,
          displayName: cv.display_name || cv.name,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to make CV active");
      }

      if (!controlledCvs) {
        await fetchCvs();
      }
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to make CV active");
    } finally {
      setBusyId("");
      setBusyAction("");
    }
  };

  const handleDelete = async (cv: CV) => {
    if (!confirm(`Delete "${getCvName(cv)}"? This cannot be undone.`)) {
      return;
    }

    setBusyId(cv.id);
    setBusyAction("delete");
    setError("");

    try {
      const res = await fetch("/api/cv", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cv.id }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to delete CV");
      }

      if (controlledCvs) {
        onDelete?.(cv.id);
      } else {
        setInternalCvs((current) => current.filter((item) => item.id !== cv.id));
      }
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete CV");
    } finally {
      setBusyId("");
      setBusyAction("");
    }
  };

  const handleAddCv = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedUrl = addingCvUrl.trim();
    if (!trimmedUrl) {
      return;
    }

    if (!isValidGoogleDocsUrl(trimmedUrl)) {
      setError("Enter a valid Google Docs URL.");
      setIsComposerOpen(true);
      return;
    }

    setIsAdding(true);
    setError("");

    try {
      const res = await fetch("/api/cv/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docUrl: trimmedUrl }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to add CV");
      }

      setAddingCvUrl("");
      setIsComposerOpen(false);
      if (!controlledCvs) {
        await fetchCvs();
      }
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add CV");
      setIsComposerOpen(true);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)] sm:text-2xl">
            My CVs
          </h1>
          <p className="mt-1 hidden text-sm text-[var(--color-text-muted)] sm:block">
            Manage your CV templates
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsComposerOpen((open) => !open)}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
        >
          {isComposerOpen ? "Close" : "+ Add CV"}
        </button>
      </section>

      <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(24,24,27,1),rgba(24,24,27,0.92))]">
        <button
          type="button"
          aria-expanded={isComposerOpen}
          onClick={() => setIsComposerOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-white/[0.02] sm:p-5"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--color-text)]">+ Add a CV</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Paste a Google Docs link to import and parse your resume.
            </p>
          </div>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] transition-transform duration-200 ${
              isComposerOpen ? "rotate-180" : ""
            }`}
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="m5 8 5 5 5-5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
            isComposerOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <form onSubmit={handleAddCv} className="border-t border-[var(--color-border)] px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
              <label htmlFor="cv-doc-url" className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Google Docs URL
              </label>
              <input
                id="cv-doc-url"
                type="url"
                value={addingCvUrl}
                onChange={(event) => {
                  setAddingCvUrl(event.target.value);
                  if (error) {
                    setError("");
                  }
                }}
                placeholder="https://docs.google.com/document/d/..."
                required
                className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
              />

              {error ? <div className="mt-3"><ErrorBanner message={error} onDismiss={() => setError("")} /></div> : null}

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={isAdding}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[144px]"
                >
                  {isAdding ? <Spinner className="h-4 w-4" /> : null}
                  {isAdding ? "Loading your CV..." : "Load CV"}
                </button>
                {isAdding ? (
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <Spinner className="h-4 w-4 text-[var(--color-accent)]" />
                    <span>Loading your CV...</span>
                  </div>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </section>

      {error && !isComposerOpen ? <ErrorBanner message={error} onDismiss={() => setError("")} /> : null}

      {isLoading ? (
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
          <div className="flex items-center justify-center gap-3 text-sm text-[var(--color-text-secondary)]">
            <Spinner className="h-5 w-5 text-[var(--color-accent)]" />
            <span>Loading your CVs...</span>
          </div>
        </section>
      ) : null}

      {!isLoading && cvs.length === 0 ? (
        <section className="rounded-xl border border-dashed border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(24,24,27,0.95),rgba(9,9,11,1))] px-6 py-10 text-center sm:px-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M8 3.75h5.086c.398 0 .779.158 1.06.44l3.664 3.664c.281.281.44.663.44 1.06v9.836A1.5 1.5 0 0 1 16.75 20.25h-8.5a1.5 1.5 0 0 1-1.5-1.5v-13.5a1.5 1.5 0 0 1 1.5-1.5Z"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M13 3.75v4a1 1 0 0 0 1 1h4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 12.25h6M9 15.75h4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h2 className="mt-5 text-lg font-semibold text-[var(--color-text)]">No CVs yet</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Add your first CV from Google Docs.
          </p>
          <button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="mx-auto mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-[var(--color-accent)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Add your first CV
          </button>
        </section>
      ) : null}

      {!isLoading && cvs.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Saved CVs
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">{cvs.length} total</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {cvs.map((cv) => {
              const name = getCvName(cv);
              const isBusy = busyId === cv.id;
              const isSelected = currentCvId === cv.id;
              const isActive = Boolean(cv.is_preset);
              const urlLabel = getUrlLabel(cv.doc_url);

              return (
                <article
                  key={cv.id}
                  className={`flex h-full flex-col rounded-xl border p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--color-muted)] hover:shadow-[0_18px_48px_-32px_rgba(0,0,0,0.8)] sm:p-5 ${
                    isActive
                      ? "border-[color:rgba(99,102,241,0.5)] bg-[linear-gradient(180deg,rgba(99,102,241,0.12),rgba(24,24,27,1)_55%)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)]"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <DocumentIcon initials={getCvInitials(name)} active={isActive} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-medium text-[var(--color-text)]">
                            {name}
                          </h3>
                          <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">
                            {urlLabel}
                          </p>
                        </div>
                        {isSelected ? (
                          <span className="shrink-0 rounded-full border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-2.5 py-1 text-[11px] font-medium text-[var(--color-success)]">
                            In wizard
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 flex min-h-6 items-center gap-2 text-xs text-[var(--color-text-muted)]">
                        {isActive ? (
                          <span className="rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-2.5 py-1 font-medium text-[var(--color-accent-hover)]">
                            Active
                          </span>
                        ) : (
                          <span>Updated {updatedAtFormatter.format(new Date(cv.updated_at))}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 min-[400px]:flex-row min-[400px]:flex-wrap">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        if (onSelect) {
                          onSelect(cv);
                          return;
                        }

                        window.location.href = `/?cvId=${encodeURIComponent(cv.id)}`;
                      }}
                      className={`inline-flex h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors min-[400px]:flex-1 ${
                        isSelected
                          ? "border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]"
                          : "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {isSelected ? "Using in wizard" : "Use in wizard"}
                    </button>

                    {!isActive ? (
                      <button
                        type="button"
                        onClick={() => void handleMakeActive(cv)}
                        disabled={isBusy}
                        className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--color-border)] bg-transparent px-4 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-muted)] hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-60 min-[400px]:w-auto"
                      >
                        {isBusy && busyAction === "activate" ? "Saving..." : "Set active"}
                      </button>
                    ) : null}

                    <a
                      href={cv.doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--color-border)] bg-transparent px-4 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-muted)] hover:bg-[var(--color-bg)] min-[400px]:w-auto ${
                        isBusy ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      Open
                    </a>

                    <button
                      type="button"
                      onClick={() => void handleDelete(cv)}
                      disabled={isBusy}
                      className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-4 text-sm font-medium text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/15 disabled:cursor-not-allowed disabled:opacity-60 min-[400px]:w-auto"
                    >
                      {isBusy && busyAction === "delete" ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
