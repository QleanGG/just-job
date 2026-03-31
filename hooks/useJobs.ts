"use client";

import { useQuery } from "@tanstack/react-query";
import type { Revision, KeywordAnalysis, CV } from "@/lib/supabase";

export type JobDetails = {
  revisions: Revision[];
  analysis: KeywordAnalysis[];
  cvs: CV[];
};

export function useJobDetails(jobId: string) {
  return useQuery<JobDetails>({
    queryKey: ["job-details", jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/details`);
      if (!res.ok) throw new Error("Failed to fetch details");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: Boolean(jobId),
  });
}
