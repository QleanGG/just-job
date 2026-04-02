export const APPLY_SESSION_KEY = "applyWizardData";
export const SELECTED_CV_ID_KEY = "selectedCvId";

export type ApplySession = {
  selectedCvId: string | null;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  acceptedAt: string | null;
};

export const DEFAULT_APPLY_SESSION: ApplySession = {
  selectedCvId: null,
  jobTitle: "Senior Product Manager, AI Platform",
  companyName: "Northstar Systems",
  jobDescription:
    "We are looking for a product leader to drive our AI platform roadmap, partner deeply with engineering, and turn enterprise customer feedback into durable product bets. You will work across data infrastructure, developer tooling, and applied AI experiences while aligning internal stakeholders around a clear operating plan.",
  acceptedAt: null,
};

function canUseSessionStorage() {
  return typeof window !== "undefined";
}

export function readApplySession(): ApplySession {
  if (!canUseSessionStorage()) {
    return DEFAULT_APPLY_SESSION;
  }

  const selectedCvId = sessionStorage.getItem(SELECTED_CV_ID_KEY);
  const raw = sessionStorage.getItem(APPLY_SESSION_KEY);

  if (!raw) {
    return {
      ...DEFAULT_APPLY_SESSION,
      selectedCvId: selectedCvId || DEFAULT_APPLY_SESSION.selectedCvId,
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ApplySession>;

    return {
      ...DEFAULT_APPLY_SESSION,
      ...parsed,
      selectedCvId: parsed.selectedCvId ?? selectedCvId ?? DEFAULT_APPLY_SESSION.selectedCvId,
    };
  } catch {
    return {
      ...DEFAULT_APPLY_SESSION,
      selectedCvId: selectedCvId || DEFAULT_APPLY_SESSION.selectedCvId,
    };
  }
}

export function writeApplySession(updates: Partial<ApplySession>) {
  const nextState = {
    ...readApplySession(),
    ...updates,
  };

  if (!canUseSessionStorage()) {
    return nextState;
  }

  if (nextState.selectedCvId) {
    sessionStorage.setItem(SELECTED_CV_ID_KEY, nextState.selectedCvId);
  } else {
    sessionStorage.removeItem(SELECTED_CV_ID_KEY);
  }

  sessionStorage.setItem(APPLY_SESSION_KEY, JSON.stringify(nextState));
  return nextState;
}
