"use client";

import { useQuery } from "@tanstack/react-query";
import type { CV } from "@/lib/supabase";

export function useCVs() {
  return useQuery<CV[]>({
    queryKey: ["cvs"],
    queryFn: async () => {
      const res = await fetch("/api/cv");
      if (!res.ok) throw new Error("Failed to fetch CVs");
      return res.json();
    },
  });
}
