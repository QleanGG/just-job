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

function readStoredApplySession(): Partial<ApplySession> | null {
  if (!canUseSessionStorage()) {
    return null;
  }

  const raw = sessionStorage.getItem(APPLY_SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Partial<ApplySession>;
  } catch {
    return null;
  }
}

export function readApplySession(): ApplySession {
  if (!canUseSessionStorage()) {
    return DEFAULT_APPLY_SESSION;
  }

  const selectedCvId = sessionStorage.getItem(SELECTED_CV_ID_KEY);
  const stored = readStoredApplySession();

  return {
    ...DEFAULT_APPLY_SESSION,
    ...stored,
    selectedCvId: stored?.selectedCvId ?? selectedCvId ?? DEFAULT_APPLY_SESSION.selectedCvId,
  };
}

export function writeApplySession(updates: Partial<ApplySession>) {
  const selectedCvId = canUseSessionStorage()
    ? sessionStorage.getItem(SELECTED_CV_ID_KEY)
    : DEFAULT_APPLY_SESSION.selectedCvId;
  const nextState = {
    ...(readStoredApplySession() ?? {}),
    ...updates,
  };
  const resolvedState = {
    ...DEFAULT_APPLY_SESSION,
    ...nextState,
    selectedCvId: nextState.selectedCvId ?? selectedCvId ?? DEFAULT_APPLY_SESSION.selectedCvId,
  };

  if (!canUseSessionStorage()) {
    return resolvedState;
  }

  if (nextState.selectedCvId) {
    sessionStorage.setItem(SELECTED_CV_ID_KEY, nextState.selectedCvId);
  } else {
    sessionStorage.removeItem(SELECTED_CV_ID_KEY);
  }

  sessionStorage.setItem(APPLY_SESSION_KEY, JSON.stringify(nextState));
  return resolvedState;
}
