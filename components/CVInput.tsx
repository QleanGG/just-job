"use client";

import { useEffect, useState } from "react";
import { CV } from "@/lib/supabase";
import { CVSection } from "@/lib/types";

interface CVInputProps {
  initialUrl: string;
  onUrlChange: (url: string) => void;
  onCVLoaded: (sections: CVSection[], cvId?: string) => void;
  onPresetSaved?: (preset: {
    cvId: string;
    displayName: string;
    docUrl: string;
    sections: CVSection[];
  }) => void;
}

export default function CVInput({
  initialUrl,
  onUrlChange,
  onCVLoaded,
  onPresetSaved,
}: CVInputProps) {
  const [url, setUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<CVSection[] | null>(null);
  const [savedCvId, setSavedCvId] = useState("");
  const [presetSaved, setPresetSaved] = useState(false);

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  const handleFetch = async () => {
    if (!url.trim()) {
      setError("Please enter a Google Docs URL");
      return;
    }

    setIsLoading(true);
    setError("");
    setPreview(null);
    setSavedCvId("");
    setPresetSaved(false);

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
        setSavedCvId(data.cvId);
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
      onCVLoaded(preview, savedCvId || undefined);
    }
  };

  const handleSavePreset = async () => {
    if (!preview || !savedCvId) {
      setError("Load the CV first");
      return;
    }

    setIsSavingPreset(true);
    setError("");

    try {
      const res = await fetch("/api/cv", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: savedCvId,
          isPreset: true,
          displayName: "My Resume",
        }),
      });

      const data = (await res.json().catch(() => null)) as CV | { error?: string } | null;
      if (!res.ok) {
        throw new Error((data as { error?: string } | null)?.error || "Failed to save preset");
      }

      setPresetSaved(true);
      onUrlChange(url);
      onPresetSaved?.({
        cvId: savedCvId,
        displayName: (data as CV).display_name || "My Resume",
        docUrl: url,
        sections: preview,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save preset");
    } finally {
      setIsSavingPreset(false);
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
          {presetSaved && (
            <p className="mt-4 text-xs text-[var(--color-text-muted)]">Saved as My CV</p>
          )}
        </div>
      )}

      {preview ? (
        <div className="flex gap-3">
          <button
            onClick={handleSavePreset}
            disabled={isSavingPreset || !savedCvId}
            className="px-5 py-3 border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] disabled:opacity-40 transition-colors"
          >
            {isSavingPreset ? "Saving…" : "Save as My CV"}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors"
          >
            Continue →
          </button>
        </div>
      ) : (
        <button
          onClick={handleFetch}
          disabled={isLoading}
          className="w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isLoading ? "Loading…" : "Load CV"}
        </button>
      )}
    </div>
  );
}
