"use client";

import { useWizard } from "@/components/WizardProvider";

export default function WizardErrorBanner() {
  const { error, handleExportToGoogleDocs, handleTailor, resultUrl, setError, step } = useWizard();

  if (!error) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-[var(--color-surface)] border border-[var(--color-error)]/30 rounded-lg text-sm text-[var(--color-error)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <span className="font-medium">Something went wrong</span>
          <span className="text-[var(--color-text-secondary)]"> - </span>
          <span className="text-[var(--color-text-secondary)]">{error}</span>
        </div>
        <div className="flex gap-2 ml-auto shrink-0">
          {step === 3 && (
            <button
              onClick={handleTailor}
              className="px-3 py-1.5 text-xs bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          )}
          {step === 4 && !resultUrl && (
            <button
              onClick={handleExportToGoogleDocs}
              className="px-3 py-1.5 text-xs bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => setError("")}
            className="text-lg leading-none opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
