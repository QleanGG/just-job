"use client";

import { ReactNode } from "react";
import SwipeShell from "@/components/SwipeShell";

const APP_TABS = [
  { path: "/shell/dashboard", label: "Applications", icon: "assignment_turned_in" },
  { path: "/shell/cvs", label: "Resumes", icon: "description" },
  { path: "/shell/profile", label: "Profile", icon: "account_circle" },
];

interface SwipeShellWrapperProps {
  dashboard: ReactNode;
  cvs: ReactNode;
  profile: ReactNode;
}

export default function SwipeShellWrapper({ dashboard, cvs, profile }: SwipeShellWrapperProps) {
  return (
    <SwipeShell
      tabs={APP_TABS}
      initialPanel={0}
      panels={[dashboard, cvs, profile]}
    />
  );
}
