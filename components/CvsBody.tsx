"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Icon, MiniDocument, SurfaceCard } from "@/components/redesign/ui";
import { Sidebar } from "@/components/redesign/sidebar";
import { TopBar } from "@/components/redesign/topbar";
import { useCVs } from "@/hooks/useCVs";
import type { CV } from "@/lib/supabase";

function formatUpdatedAt(value: string) {
  return `Updated ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))}`;
}

function getCvTitle(cv: CV) {
  return cv.display_name || cv.name || "Untitled CV";
}

function isOlderThanThirtyDays(value: string) {
  return Date.now() - new Date(value).getTime() > 30 * 24 * 60 * 60 * 1000;
}

function GoogleMark() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#4285F4]">
      G
    </span>
  );
}

export default function CvsBody() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: cvs = [], isLoading } = useCVs();
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const archiveTableRef = useRef<HTMLDivElement | null>(null);

  const sortedCvs = [...cvs].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
  const activeBase =
    sortedCvs.find((cv) => cv.is_preset) ||
    sortedCvs[0] ||
    null;
  const remainingCvs = sortedCvs.filter((cv) => cv.id !== activeBase?.id);
  const archiveCvs = remainingCvs.filter((cv) => isOlderThanThirtyDays(cv.updated_at));
  const visibleArchive = archiveCvs.length ? archiveCvs : remainingCvs;
  const historyRows = showAllHistory ? visibleArchive : visibleArchive.slice(0, 3);
  const hasMoreHistory = visibleArchive.length > 3;

  const handleUploadCv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);

    try {
      const response = await fetch("/api/cv", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Failed to upload CV");
      }

      await queryClient.invalidateQueries({ queryKey: ["cvs"] });
      toast.success("CV uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload CV");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoogleDocsClick = () => {
    toast((toastInstance) => (
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-900">Connect Google Docs in Settings.</span>
        <button
          type="button"
          onClick={() => {
            toast.dismiss(toastInstance.id);
            router.push("/profile");
          }}
          className="text-sm font-semibold text-sky-600 transition hover:text-sky-700"
        >
          Open settings
        </button>
      </div>
    ));
  };

  const handleCreateEmptyTemplate = async () => {
    const providedName = window.prompt("Template name", "New Template");
    if (providedName === null) {
      return;
    }

    const templateName = providedName.trim() || "New Template";
    setIsCreatingTemplate(true);

    try {
      const response = await fetch("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          name: templateName,
          docUrl: null,
          parsedSections: [],
          isPreset: false,
          displayName: templateName,
        }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create template");
      }

      await queryClient.invalidateQueries({ queryKey: ["cvs"] });
      toast.success(`Created "${templateName}".`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create template");
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const handleViewAllHistory = () => {
    if (hasMoreHistory && !showAllHistory) {
      setShowAllHistory(true);
      window.requestAnimationFrame(() => {
        archiveTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }

    archiveTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (hasMoreHistory && showAllHistory) {
      setShowAllHistory(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--on-surface)]">
      <Sidebar active="cvs" />
      <TopBar searchPlaceholder="Search CVs..." />
      <div className="relative min-h-screen lg:pl-64">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_top_left,rgba(110,155,255,0.14),transparent_34rem)]" />
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
                <label
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[rgba(25,37,64,0.7)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(25,37,64,0.92)]"
                  aria-disabled={isUploading}
                >
                  <Icon name="cloud_upload" className="text-[18px] text-[var(--primary)]" />
                  {isUploading ? "Uploading..." : "Upload CV"}
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc"
                    className="hidden"
                    onChange={handleUploadCv}
                    disabled={isUploading}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleGoogleDocsClick}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[rgba(25,37,64,0.7)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(25,37,64,0.92)]"
                >
                  <GoogleMark />
                  Google Docs
                </button>
              </div>
            </section>

            {isLoading ? (
              <div className="p-8 text-center text-[var(--on-surface-variant)]">Loading...</div>
            ) : activeBase ? (
              <>
                <section className="grid gap-5 xl:grid-cols-3">
                  <SurfaceCard className="rounded-[1.9rem] bg-[linear-gradient(145deg,rgba(20,31,56,0.96),rgba(25,37,64,0.88))] p-6 hover:bg-[linear-gradient(145deg,rgba(20,31,56,0.96),rgba(25,37,64,0.88))] xl:col-span-2">
                    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                      <div className="rounded-[1.6rem] bg-[rgba(9,19,40,0.5)] p-4">
                        <MiniDocument title={getCvTitle(activeBase)} className="shadow-[0_20px_48px_rgba(0,0,0,0.12)]" />
                      </div>

                      <div>
                        <span className="inline-flex items-center rounded-full bg-[rgba(129,236,255,0.14)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                          Active Base
                        </span>
                        <h2 className="mt-5 font-headline text-3xl font-extrabold tracking-[-0.05em] text-white sm:text-4xl">
                          {getCvTitle(activeBase)}
                        </h2>
                        <p className="mt-3 text-sm text-[var(--on-surface-variant)]">
                          {formatUpdatedAt(activeBase.updated_at)} · 1 version
                        </p>
                        <p className="mt-4 text-base leading-7 text-[var(--on-surface-variant)]">
                          {activeBase.is_preset
                            ? "Preset base CV used as the starting point for new tailoring workflows."
                            : "Most recently updated CV available as the current default base template."}
                        </p>
                        {activeBase.doc_url ? (
                          <a
                            href={activeBase.doc_url}
                            target="_blank"
                            rel="noreferrer"
                            className="primary-button mt-8 inline-flex rounded-full px-6"
                          >
                            <Icon name="open_in_new" className="text-[18px]" />
                            Open Template
                          </a>
                        ) : (
                          <button type="button" className="primary-button mt-8 rounded-full px-6">
                            <Icon name="description" className="text-[18px]" />
                            Template Ready
                          </button>
                        )}
                      </div>
                    </div>
                  </SurfaceCard>

                  {remainingCvs.map((cv) => (
                    <SurfaceCard
                      key={cv.id}
                      className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-5 hover:bg-[var(--surface-container-highest)]"
                    >
                      <MiniDocument title={getCvTitle(cv)} accent="secondary" />
                      <div className="mt-5">
                        <h3 className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">{getCvTitle(cv)}</h3>
                        <p className="mt-2 text-sm text-[var(--on-surface-variant)]">
                          {formatUpdatedAt(cv.updated_at)} · 1 version
                        </p>
                        <p className="mt-3 text-sm text-[var(--on-surface-variant)]">
                          {cv.doc_url ? "Linked source document available" : "No external source document linked yet"}
                        </p>
                      </div>
                      {cv.doc_url ? (
                        <a
                          href={cv.doc_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-6 inline-flex items-center justify-center rounded-full bg-[rgba(110,155,255,0.14)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--secondary)] transition hover:bg-[rgba(110,155,255,0.22)]"
                        >
                          Open CV
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="mt-6 inline-flex items-center justify-center rounded-full bg-[rgba(110,155,255,0.14)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--secondary)] transition hover:bg-[rgba(110,155,255,0.22)]"
                        >
                          Stored CV
                        </button>
                      )}
                    </SurfaceCard>
                  ))}

                  <button
                    type="button"
                    onClick={handleCreateEmptyTemplate}
                    disabled={isCreatingTemplate}
                    className="flex min-h-[22rem] w-full items-center justify-center rounded-[1.75rem] border border-dashed border-white/15 bg-[rgba(9,19,40,0.5)] p-6 text-center transition hover:border-white/25 hover:bg-[rgba(9,19,40,0.62)] disabled:cursor-not-allowed disabled:opacity-60 xl:col-span-1"
                  >
                    <div className="max-w-xs">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[rgba(129,236,255,0.12)] text-[var(--primary)]">
                        <Icon name="add" className="text-[30px]" />
                      </div>
                      <h3 className="mt-5 font-headline text-2xl font-extrabold tracking-[-0.04em] text-white">
                        {isCreatingTemplate ? "Creating Template..." : "Create Empty Template"}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-[var(--on-surface-variant)]">
                        Start from a blank canvas when you need a new story architecture for a different role family.
                      </p>
                    </div>
                  </button>
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
                      onClick={handleViewAllHistory}
                      className="inline-flex rounded-full bg-[rgba(25,37,64,0.78)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)] transition hover:bg-[rgba(25,37,64,0.94)]"
                    >
                      {hasMoreHistory && showAllHistory ? "Show recent history" : "View all history"}
                    </button>
                  </div>

                  <div ref={archiveTableRef} className="mt-6 overflow-x-auto">
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
                        {visibleArchive.length ? (
                          historyRows.map((cv) => (
                            <tr key={cv.id} className="border-b border-white/6 last:border-b-0">
                              <td className="py-4 pr-4 font-medium text-white">{getCvTitle(cv)}</td>
                              <td className="py-4 pr-4 text-[var(--on-surface-variant)]">
                                {formatUpdatedAt(cv.updated_at).replace("Updated ", "")}
                              </td>
                              <td className="py-4 pr-4">
                                <span className="inline-flex rounded-full bg-[rgba(25,37,64,0.72)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--secondary)]">
                                  {cv.is_preset ? "Preset" : isOlderThanThirtyDays(cv.updated_at) ? "Archived" : "Available"}
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                {cv.doc_url ? (
                                  <a
                                    href={cv.doc_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-[var(--primary)] transition hover:text-white"
                                  >
                                    Preview
                                  </a>
                                ) : (
                                  <span className="font-semibold text-[var(--on-surface-variant)]">Stored</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-[var(--on-surface-variant)]">
                              No archived CVs yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            ) : (
              <SurfaceCard className="rounded-[1.75rem] bg-[var(--surface-container-high)] p-10 text-center text-[var(--on-surface-variant)]">
                No CVs uploaded yet.
              </SurfaceCard>
            )}
          </div>
        </main>
      </div>

    </div>
  );
}
