"use client";

import { useState } from "react";
import { JobListing } from "@/lib/types";

interface JobInputProps {
  onJobLoaded: (job: JobListing) => void;
  onBack: () => void;
}

type InputMode = "url" | "text";

export default function JobInput({ onJobLoaded, onBack }: JobInputProps) {
  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<JobListing | null>(null);

  const handleFetch = async () => {
    if (mode === "url" && !url.trim()) {
      setError("Enter a job listing URL");
      return;
    }
    if (mode === "text" && !text.trim()) {
      setError("Paste a job description");
      return;
    }

    setIsLoading(true);
    setError("");
    setPreview(null);

    try {
      const body = mode === "url" ? { url } : { text };
      const res = await fetch("/api/job/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch job");
      }

      const data: JobListing = await res.json();
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (preview) onJobLoaded(preview);
  };

  return (
    <div className="space-y-5">
      {/* Mode Toggle */}
      <div className="flex bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1">
        <button
          onClick={() => { setMode("url"); setPreview(null); setError(""); }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === "url"
              ? "bg-[var(--color-bg)] text-[var(--color-text)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          Job URL
        </button>
        <button
          onClick={() => { setMode("text"); setPreview(null); setError(""); }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === "text"
              ? "bg-[var(--color-bg)] text-[var(--color-text)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          Paste Text
        </button>
      </div>

      {/* Input */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
        {mode === "url" ? (
          <>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
              Job Listing URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.linkedin.com/jobs/... or indeed.com/..."
              className="w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
            <p className="mt-2.5 text-xs text-[var(--color-text-muted)]">
              Supports LinkedIn, Indeed, Greenhouse, Lever
            </p>
          </>
        ) : (
          <>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
              Job Description
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the job title, company, and full job description…"
              rows={8}
              className="w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none"
            />
          </>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)]">
          {error}{" "}
          {mode === "url" && (
            <button
              onClick={() => setMode("text")}
              className="underline ml-1 hover:no-underline"
            >
              Paste text instead
            </button>
          )}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text)]">
                {preview.title}
              </h3>
              {preview.company && (
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {preview.company}
                </p>
              )}
            </div>
            <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg)] border border-[var(--color-border)] px-2 py-1 rounded">
              {preview.source}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] line-clamp-4">
            {preview.description.substring(0, 400)}
            {preview.description.length > 400 ? "…" : ""}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-5 py-3 border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors"
        >
          Back
        </button>
        <button
          onClick={preview ? handleConfirm : handleFetch}
          disabled={isLoading}
          className="flex-1 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isLoading ? "Loading…" : preview ? "Continue →" : "Load Job"}
        </button>
      </div>
    </div>
  );
}
