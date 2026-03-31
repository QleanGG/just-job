"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { CV } from "@/lib/supabase";
import { generateId } from "@/lib/utils";
import type {
  CVSection,
  JobListing,
  TailoredSection,
  Job,
  KeywordAnalysisSummary,
} from "@/lib/types";

type Step = 1 | 2 | 3 | 4;

type PresetPayload = {
  cvId: string;
  displayName: string;
  docUrl: string;
  sections: CVSection[];
};

function normalizeDocUrl(url: string | null | undefined) {
  return url ?? "";
}

function getDeepLinkParams() {
  if (typeof window === "undefined") {
    return { jobId: "", cvId: "" };
  }

  const searchParams = new URLSearchParams(window.location.search);

  return {
    jobId: searchParams.get("jobId") || "",
    cvId: searchParams.get("cvId") || "",
  };
}

function clearDeepLinkParams() {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete("jobId");
  url.searchParams.delete("cvId");

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, "", nextUrl);
}

type WizardContextValue = {
  applyCv: (cv: CV, nextStep?: Step) => void;
  currentCvId: string;
  cvPresets: CV[];
  error: string;
  fetchCvPresets: () => Promise<void>;
  handleCVLoaded: (sections: CVSection[], id?: string) => void;
  handleJobLoaded: (jobData: JobListing) => Promise<void>;
  handlePresetSaved: (preset: PresetPayload) => void;
  handleExportToGoogleDocs: () => Promise<void>;
  handleReset: () => void;
  handleRevise: () => Promise<void>;
  handleTailor: () => Promise<void>;
  isLoading: boolean;
  isRevising: boolean;
  job: JobListing | null;
  jobHistory: Job[];
  keywordAnalysis: KeywordAnalysisSummary | null;
  loadJobFromHistory: (job: Job) => void;
  loadingMessage: string;
  resultUrl: string;
  revisionFeedback: string;
  revisionNumber: number;
  setError: (value: string) => void;
  setCvUrl: (value: string) => void;
  setRevisionFeedback: (value: string) => void;
  step: Step;
  setStep: (step: Step) => void;
  tailoredSections: TailoredSection[];
  cvSections: CVSection[];
  cvUrl: string;
};

const WizardContext = createContext<WizardContextValue | null>(null);

function getParsedSections(parsedSections: CV["parsed_sections"]): CVSection[] {
  return Array.isArray(parsedSections) ? (parsedSections as CVSection[]) : [];
}

type WizardProviderProps = {
  children: ReactNode;
  initialCv?: CV | null;
  initialJob?: Job | null;
};

export function WizardProvider({
  children,
  initialCv = null,
  initialJob = null,
}: WizardProviderProps) {
  const [step, setStep] = useState<Step>(1);
  const [cvUrl, setCvUrl] = useState("");
  const [cvId, setCvId] = useState("");
  const [cvSections, setCvSections] = useState<CVSection[]>([]);
  const [job, setJob] = useState<JobListing | null>(null);
  const [jobId, setJobId] = useState("");
  const [tailoredSections, setTailoredSections] = useState<TailoredSection[]>([]);
  const [resultUrl, setResultUrl] = useState("");
  const [revisionNumber, setRevisionNumber] = useState(1);
  const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysisSummary | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [isRevising, setIsRevising] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");
  const [jobHistory, setJobHistory] = useState<Job[]>([]);
  const [cvPresets, setCvPresets] = useState<CV[]>([]);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs?limit=50");
      if (!res.ok) {
        throw new Error("Failed to load jobs");
      }
      const data = (await res.json()) as Job[];
      setJobHistory(data);
    } catch (err) {
      console.error("Failed to load jobs:", err);
    }
  };

  const fetchCvPresets = async () => {
    try {
      const res = await fetch("/api/cv");
      if (!res.ok) {
        throw new Error("Failed to load CVs");
      }
      const data = (await res.json()) as CV[];
      setCvPresets(data);
    } catch (err) {
      console.error("Failed to load CVs:", err);
    }
  };

  const fetchCvById = async (id: string) => {
    const res = await fetch("/api/cv");
    if (!res.ok) {
      throw new Error("Failed to load CV");
    }

    const data = (await res.json()) as CV[];
    return data.find((cv) => cv.id === id) || null;
  };

  const resetResults = () => {
    setJob(null);
    setJobId("");
    setTailoredSections([]);
    setResultUrl("");
    setRevisionNumber(1);
    setKeywordAnalysis(null);
    setRevisionFeedback("");
    setError("");
  };

  const applyCv = (cv: CV, nextStep?: Step) => {
    setCvUrl(normalizeDocUrl(cv.doc_url));
    setCvId(cv.id);
    setCvSections(getParsedSections(cv.parsed_sections));
    resetResults();
    if (nextStep) {
      setStep(nextStep);
    }
  };

  const fetchInitialCv = async () => {
    try {
      const presetRes = await fetch("/api/cv?preset=true");
      if (presetRes.ok) {
        const preset = (await presetRes.json()) as CV | null;
        if (preset) {
          setCvUrl(normalizeDocUrl(preset.doc_url));
          setCvId(preset.id);
          setCvSections(getParsedSections(preset.parsed_sections));
          return;
        }
      }

      const res = await fetch("/api/cv");
      if (res.ok) {
        const data = (await res.json()) as CV[];
        if (data.length > 0) {
          setCvUrl(normalizeDocUrl(data[0].doc_url));
          setCvId(data[0].id);
          setCvSections(getParsedSections(data[0].parsed_sections));
        }
      }
    } catch (err) {
      console.error("Failed to load CV:", err);
    }
  };

  const handleCVLoaded = (sections: CVSection[], id?: string) => {
    if (id) {
      setCvId(id);
    }
    setCvSections(sections);
    resetResults();
    void fetchJobs();
    setStep(2);
  };

  const handlePresetSaved = (preset: PresetPayload) => {
    setCvId(preset.cvId);
    setCvUrl(normalizeDocUrl(preset.docUrl));
    setCvSections(preset.sections);
    resetResults();
    void fetchCvPresets();
  };

  const applyHistoryJob = (historyJob: Job) => {
    setJob({
      title: historyJob.job_title,
      company: historyJob.job_company || "",
      description: historyJob.job_description || "",
      source: "manual",
      url: historyJob.job_url || undefined,
    });
    setJobId(historyJob.id);
    setTailoredSections([]);
    setResultUrl("");
    setRevisionNumber(1);
    setKeywordAnalysis(null);
    setRevisionFeedback("");
    setError("");
    setStep(3);
  };

  const loadDeepLinkedWizardState = async () => {
    const { jobId: deepLinkedJobId, cvId: deepLinkedCvId } = getDeepLinkParams();
    const hasDeepLink = Boolean(deepLinkedJobId || deepLinkedCvId);

    if (!hasDeepLink) {
      return "none" as const;
    }

    setIsLoading(true);
    setLoadingMessage("Loading saved application...");
    setError("");

    try {
      let selectedCv = initialCv;

      if (deepLinkedCvId) {
        selectedCv = await fetchCvById(deepLinkedCvId);
        if (!selectedCv) {
          throw new Error("Saved CV not found");
        }
      }

      if (selectedCv) {
        applyCv(selectedCv, deepLinkedJobId ? 3 : 2);
      } else {
        await fetchInitialCv();
      }

      if (deepLinkedJobId) {
        const jobRes = await fetch(`/api/jobs/${deepLinkedJobId}`);
        if (!jobRes.ok) {
          throw new Error("Saved application not found");
        }

        const deepLinkedJob = (await jobRes.json()) as Job;
        applyHistoryJob(deepLinkedJob);
      }

      return "loaded" as const;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load saved application");
      return "failed" as const;
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
      clearDeepLinkParams();
    }
  };

  useEffect(() => {
    const initialize = async () => {
      void fetchJobs();
      void fetchCvPresets();

      const deepLinkStatus = await loadDeepLinkedWizardState();
      if (deepLinkStatus === "loaded") {
        return;
      }

      if (initialCv) {
        applyCv(initialCv, initialJob ? 3 : 2);
      } else {
        await fetchInitialCv();
      }

      if (initialJob) {
        applyHistoryJob(initialJob);
      }
    };

    void initialize();
  }, []);

  const handleJobLoaded = async (jobData: JobListing) => {
    const id = generateId();
    setError("");

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          cvId: cvId || null,
          jobUrl: jobData.url || null,
          jobTitle: jobData.title,
          jobCompany: jobData.company,
          jobDescription: jobData.description,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to save job");
      }

      setJobId(id);
      await fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save job");
      return;
    }

    setJob(jobData);
    setTailoredSections([]);
    setResultUrl("");
    setKeywordAnalysis(null);
    setRevisionFeedback("");
    setRevisionNumber(1);
    setStep(3);
  };

  const handleTailor = async () => {
    setIsLoading(true);
    setError("");
    setLoadingMessage("Analyzing your CV and the job…");

    try {
      setLoadingMessage("Rewriting sections for maximum fit…");
      const tailorRes = await fetch("/api/cv/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: cvSections, job, jobId }),
      });

      if (!tailorRes.ok) {
        const err = await tailorRes.json();
        throw new Error(err.error || "Failed to tailor CV");
      }

      const { tailoredSections: tailored, keywordAnalysis: analysis } = await tailorRes.json();
      setTailoredSections(tailored);
      setKeywordAnalysis(analysis || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToGoogleDocs = async () => {
    if (!tailoredSections.length) {
      setError("Run the AI analysis first");
      return;
    }

    setIsLoading(true);
    setError("");
    setLoadingMessage("Creating your new Google Doc…");

    try {
      const exportRes = await fetch("/api/cv/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tailoredSections,
          jobId,
          jobTitle: job?.title,
          company: job?.company,
          cvId,
          cvUrl,
        }),
      });

      if (!exportRes.ok) {
        const err = await exportRes.json();
        throw new Error(err.error || "Failed to create document");
      }

      const { newDocUrl } = await exportRes.json();
      setResultUrl(newDocUrl);
      setRevisionNumber(1);
      setStep(4);
      void fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create document");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    resetResults();
    setStep(1);
  };

  const handleRevise = async () => {
    if (!revisionFeedback.trim() || !job || !jobId) {
      return;
    }

    setIsRevising(true);
    setError("");

    try {
      const res = await fetch("/api/cv/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          previousSections: tailoredSections,
          feedback: revisionFeedback,
          job,
          cvUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to revise");
      }

      const {
        tailoredSections: revised,
        newDocUrl,
        revisionNumber: nextRevisionNumber,
        keywordAnalysis: analysis,
      } = await res.json();

      setTailoredSections(revised);
      setKeywordAnalysis(analysis || null);
      setResultUrl((currentUrl) => newDocUrl || currentUrl);
      setRevisionNumber(nextRevisionNumber);
      setRevisionFeedback("");
      void fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revision failed");
    } finally {
      setIsRevising(false);
    }
  };

  const loadJobFromHistory = (historyJob: Job) => {
    applyHistoryJob(historyJob);
  };

  return (
    <WizardContext.Provider
      value={{
        applyCv,
        currentCvId: cvId,
        cvPresets,
        error,
        fetchCvPresets,
        handleCVLoaded,
        handleExportToGoogleDocs,
        handleJobLoaded,
        handlePresetSaved,
        handleReset,
        handleRevise,
        handleTailor,
        isLoading,
        isRevising,
        job,
        jobHistory,
        keywordAnalysis,
        loadJobFromHistory,
        loadingMessage,
        resultUrl,
        revisionFeedback,
        revisionNumber,
        setError,
        setCvUrl,
        setRevisionFeedback,
        step,
        setStep,
        tailoredSections,
        cvSections,
        cvUrl,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);

  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }

  return context;
}
