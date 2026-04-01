"use client";

import { useQuery } from "@tanstack/react-query";
import type { Job } from "@/lib/supabase";

export function useApplications() {
  return useQuery<Job[]>({
    queryKey: ["applications"],
    queryFn: async () => {
      const res = await fetch("/api/jobs");
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    },
  });
}
