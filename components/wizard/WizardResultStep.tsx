"use client";

import { useWizard } from "@/components/WizardProvider";

export default function WizardResultStep() {
  const {
    handleExportToGoogleDocs,
    handleReset,
    handleRevise,
    isLoading,
    isRevising,
    resultUrl,
    revisionFeedback,
    revisionNumber,
    setStep,
    step,
    setRevisionFeedback,
    tailoredSections,
  } = useWizard();

  if (step !== 4 || isLoading) {
    return null;
  }

  return (
    <div className="space-y-6">
      {!resultUrl ? (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
            <p className="text-sm font-medium text-[var(--color-text)] mb-2">Ready to apply your tailored CV to Google Docs</p>
            <p className="text-sm text-[var(--color-text-muted)]">
              The AI analysis is complete. Next we will create a Google Doc version using your tailored sections.
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-3">
              {tailoredSections.length} tailored section{tailoredSections.length === 1 ? "" : "s"} ready
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-3 px-6 border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors"
            >
              Back to Analysis
            </button>
            <button
              onClick={() => void handleExportToGoogleDocs()}
              className="flex-1 py-3 px-6 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Apply to Google Docs
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 text-center">
            <div className="w-10 h-10 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-1">
              CV v{revisionNumber} ready
              {revisionNumber > 1 && ` · ${revisionNumber - 1} revision${revisionNumber > 2 ? "s" : ""}`}
            </p>
            <a
              href={resultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors mt-2"
            >
              Open in Google Docs
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
            <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Request Revision</h3>
            <textarea
              value={revisionFeedback}
              onChange={(event) => setRevisionFeedback(event.target.value)}
              placeholder="What would you like to change? e.g. 'make bullets more impact-focused', 'add more technical keywords', 'remove the certification section'…"
              rows={3}
              className="w-full px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none"
            />
            <div className="flex gap-3 mt-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
              >
                Done
              </button>
              <button
                onClick={() => void handleRevise()}
                disabled={isRevising || !revisionFeedback.trim()}
                className="flex-1 py-2 px-4 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isRevising ? "Revising…" : "Revise"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
