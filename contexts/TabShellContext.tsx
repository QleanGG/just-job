"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface TabShellContextValue {
  panels: Record<string, ReactNode>;
  registerPanel: (path: string, content: ReactNode) => void;
  unregisterPanel: (path: string) => void;
}

const TabShellContext = createContext<TabShellContextValue | null>(null);

export function TabShellProvider({ children }: { children: ReactNode }) {
  const [panels, setPanels] = useState<Record<string, ReactNode>>({});

  function registerPanel(path: string, content: ReactNode) {
    setPanels((prev) => ({ ...prev, [path]: content }));
  }

  function unregisterPanel(path: string) {
    setPanels((prev) => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }

  return (
    <TabShellContext.Provider value={{ panels, registerPanel, unregisterPanel }}>
      {children}
    </TabShellContext.Provider>
  );
}

export function useTabShell() {
  const ctx = useContext(TabShellContext);
  if (!ctx) throw new Error("useTabShell must be used within TabShellProvider");
  return ctx;
}
