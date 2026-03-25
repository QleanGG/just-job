"use client";

import { useState } from "react";
import { CVSection } from "@/lib/types";

interface CVInputProps {
  initialUrl: string;
  onUrlChange: (url: string) => void;
  onCVLoaded: (sections: CVSection[], cvId?: string) => void;
}

export default function CVInput({
  initialUrl,
  onUrlChange,
  onCVLoaded,
}: CVInputProps) {
  const [url, setUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<CVSection[] | null>(null);

  const handleFetch = async () => {
    if (!url.trim()) {
      setError("Please enter a Google Docs URL");
      return;
    }

    setIsLoading(true);
    setError("");
    setPreview(null);

    try {
      const res = await fetch("/api/cv/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docUrl: url }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load CV");
      }

      const data = await res.json();
      setPreview(data.sections);
      if (data.cvId) {
        setPreview(prev => prev); // keep preview, pass cvId on confirm
        (window as any).__cvId = data.cvId;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CV");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (preview) {
      onUrlChange(url);
      const savedCvId = (window as any).__cvId;
      onCVLoaded(preview, savedCvId);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
        <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
          Google Docs URL
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://docs.google.com/document/d/..."
          className="w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
        />
        <p className="mt-2.5 text-xs text-[var(--color-text-muted)]">
          File → Share → Publish to web (anyone with link can view)
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)]">
          {error}
        </div>
      )}

      {preview && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-4">
            {preview.length} sections loaded
          </p>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {preview.map((section, idx) => (
              <div
                key={idx}
                className="border-b border-[var(--color-border)] last:border-0 pb-3 last:pb-0"
              >
                <p className="text-sm font-medium text-[var(--color-text)] mb-1">
                  {section.title}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">
                  {section.content.substring(0, 120)}
                  {section.content.length > 120 ? "…" : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={preview ? handleConfirm : handleFetch}
        disabled={isLoading}
        className="w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {isLoading ? "Loading…" : preview ? "Continue →" : "Load CV"}
      </button>
    </div>
  );
}
