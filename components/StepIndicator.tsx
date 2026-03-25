"use client";

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { num: 1, label: "Your CV" },
  { num: 2, label: "Job Listing" },
  { num: 3, label: "Review" },
];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, idx) => (
        <div key={step.num} className="flex items-center flex-1">
          <div
            className={`min-w-[28px] h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
              currentStep > step.num
                ? "bg-[var(--color-accent)] text-white"
                : currentStep === step.num
                ? "bg-[var(--color-surface)] border border-[var(--color-accent)] text-[var(--color-text)]"
                : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]"
            }`}
          >
            {currentStep > step.num ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              step.num
            )}
          </div>

          <span
            className={`ml-2.5 text-xs hidden sm:block ${
              currentStep >= step.num
                ? "text-[var(--color-text)]"
                : "text-[var(--color-text-muted)]"
            }`}
          >
            {step.label}
          </span>

          {idx < steps.length - 1 && (
            <div
              className={`flex-1 h-px mx-3 ${
                currentStep > step.num
                  ? "bg-[var(--color-accent)]"
                  : "bg-[var(--color-border)]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
