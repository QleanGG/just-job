"use client";

import StepIndicator from "@/components/StepIndicator";
import { useWizard, WizardProvider } from "@/components/WizardProvider";
import WizardErrorBanner from "@/components/wizard/WizardErrorBanner";
import WizardLoadingState from "@/components/wizard/WizardLoadingState";
import WizardResultStep from "@/components/wizard/WizardResultStep";
import WizardStepContent from "@/components/wizard/WizardStepContent";

export { WizardProvider };

export default function Wizard() {
  const { isLoading, resultUrl, step } = useWizard();

  return (
    <>
      {!resultUrl && !isLoading && (
        <div className="mb-8">
          <StepIndicator currentStep={step} />
        </div>
      )}

      <WizardErrorBanner />
      <WizardLoadingState />
      <WizardResultStep />
      <WizardStepContent />
    </>
  );
}
