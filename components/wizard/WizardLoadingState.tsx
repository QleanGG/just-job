"use client";

import { useWizard } from "@/components/WizardProvider";

export default function WizardLoadingState() {
  const { isLoading, loadingMessage } = useWizard();

  if (!isLoading) {
    return null;
  }

  return (
    <div className="mb-6 p-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-center">
      <div className="animate-pulse mb-4">
        <div className="h-1 bg-[var(--color-border)] rounded-full w-3/4 mx-auto" />
      </div>
      <p className="text-sm text-[var(--color-text-muted)]">{loadingMessage}</p>
    </div>
  );
}
