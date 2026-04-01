"use client";

import { ReactNode } from "react";
import SwipeTabShell from "@/components/SwipeTabShell";
import { useTabShell } from "@/contexts/TabShellContext";
import { usePathname } from "next/navigation";

interface TabShellPageProps {
  children: ReactNode;
}

const TABS = [
  { path: "/dashboard", label: "Applications", icon: "assignment_turned_in" },
  { path: "/cvs", label: "Resumes", icon: "description" },
  { path: "/profile", label: "Profile", icon: "account_circle" },
] as const;

export default function TabShellPage({ children }: TabShellPageProps) {
  const { registerPanel } = useTabShell();
  const pathname = usePathname();

  // Register this page's content into the shell's panel map
  registerPanel(pathname, children);

  // Only render the shell on the active tab
  return (
    <SwipeTabShell tabs={TABS} />
  );
}
