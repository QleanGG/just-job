"use client";

import CVInput from "@/components/CVInput";
import DiffView from "@/components/DiffView";
import JobInput from "@/components/JobInput";
import { useWizard } from "@/components/WizardProvider";

export default function WizardStepContent() {
  const {
    cvPresets,
    cvSections,
    cvUrl,
    handleCVLoaded,
    handleJobLoaded,
    handlePresetSaved,
    handleTailor,
    isLoading,
    job,
    keywordAnalysis,
    resultUrl,
    setCvUrl,
    setStep,
    step,
    tailoredSections,
  } = useWizard();

  if (resultUrl || isLoading) {
    return null;
  }

  return (
    <div className="space-y-6">
      {step === 1 && (
        <CVInput
          initialUrl={cvUrl}
          presets={cvPresets}
          onUrlChange={setCvUrl}
          onCVLoaded={handleCVLoaded}
          onPresetSaved={handlePresetSaved}
        />
      )}

      {step === 2 && (
        <JobInput onJobLoaded={(jobData) => void handleJobLoaded(jobData)} onBack={() => setStep(1)} />
      )}

      {step === 3 && (
        <div className="space-y-6">
          <DiffView
            originalSections={cvSections}
            tailoredSections={tailoredSections}
            job={job}
          />

          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 px-6 border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors"
            >
              Back
            </button>
            {tailoredSections.length > 0 ? (
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-3 px-6 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors"
              >
                Continue to Google Docs
              </button>
            ) : (
              <button
                onClick={() => void handleTailor()}
                className="flex-1 py-3 px-6 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors"
              >
                Analyze with AI
              </button>
            )}
          </div>

          {keywordAnalysis && (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
              <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Keyword Match</h3>
              {keywordAnalysis.matchedKeywords.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-[var(--color-text-muted)] mb-2">Found in your CV:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {keywordAnalysis.matchedKeywords.slice(0, 15).map((keyword) => (
                      <span key={keyword} className="px-2 py-0.5 bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-[var(--color-success)] text-xs rounded-full font-medium">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {keywordAnalysis.missedKeywords.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--color-text-muted)] mb-2">Missing from your CV:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {keywordAnalysis.missedKeywords.slice(0, 15).map((keyword) => (
                      <span key={keyword} className="px-2 py-0.5 bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] text-xs rounded-full font-medium">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
