"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import DashboardBody from "@/components/DashboardBody";
import CvsBody from "@/components/CvsBody";
import ProfileBody from "@/components/ProfileBody";

const APP_TABS = [
  { path: "/dashboard", label: "Applications", icon: "assignment_turned_in" },
  { path: "/cvs", label: "Resumes", icon: "description" },
  { path: "/profile", label: "Profile", icon: "account_circle" },
];

// All three page bodies rendered together inside the swipeable shell
const PANELS = [
  { path: "/dashboard", Component: DashboardBody },
  { path: "/cvs", Component: CvsBody },
  { path: "/profile", Component: ProfileBody },
];

export default function AppLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const isProgrammaticScroll = useRef(false);

  // Sync active tab from pathname
  useEffect(() => {
    const idx = APP_TABS.findIndex(
      (t) => t.path === pathname || (t.path !== "/" && pathname.startsWith(t.path)),
    );
    if (idx !== -1) setActiveIndex(idx);
  }, [pathname]);

  function scrollToIndex(idx: number, updateRouter = true) {
    const container = containerRef.current;
    if (!container) return;
    const child = container.children[idx] as HTMLElement;
    if (!child) return;
    isProgrammaticScroll.current = true;
    container.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
    if (updateRouter) {
      router.push(APP_TABS[idx].path, { scroll: false });
    }
    setTimeout(() => { isProgrammaticScroll.current = false; }, 500);
  }

  function handleScroll() {
    if (isProgrammaticScroll.current || isDragging) return;
    const container = containerRef.current;
    if (!container) return;
    const childWidth = container.children[0]?.clientWidth || window.innerWidth;
    const idx = Math.round(container.scrollLeft / childWidth);
    if (idx !== activeIndex && idx >= 0 && idx < APP_TABS.length) {
      setActiveIndex(idx);
      router.replace(APP_TABS[idx].path, { scroll: false });
    }
  }

  function handlePointerDown() {
    setIsDragging(true);
  }

  function handlePointerUp() {
    setIsDragging(false);
    const container = containerRef.current;
    if (!container) return;
    const childWidth = container.children[0]?.clientWidth || window.innerWidth;
    const idx = Math.round(container.scrollLeft / childWidth);
    const clamped = Math.max(0, Math.min(idx, APP_TABS.length - 1));
    setActiveIndex(clamped);
    scrollToIndex(clamped);
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--background)]">
      {/* Swipeable panels */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="flex flex-1 snap-x snap-mandatory overflow-x-auto pb-20 [-webkit-overflow-scrolling:touch] [scrollbar-width:none]"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {PANELS.map(({ path, Component }) => (
          <div
            key={path}
            className="min-w-full shrink-0 snap-center overflow-y-auto bg-[var(--background)]"
          >
            <Component />
          </div>
        ))}
      </div>

      {/* Bottom tab bar */}
      <nav className="glass-panel pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[rgba(9,19,40,0.95)] lg:hidden">
        <div className="mx-auto grid h-20 max-w-md grid-cols-3 gap-2 px-4">
          {APP_TABS.map((tab, i) => {
            const active = i === activeIndex;
            return (
              <button
                key={tab.path}
                type="button"
                onClick={() => {
                  setActiveIndex(i);
                  scrollToIndex(i);
                }}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-[1.1rem] px-2 py-2 transition-all ${
                  active
                    ? "bg-[#192540] text-[var(--primary)]"
                    : "text-[#6d758c] active:scale-90"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[22px] transition-all"
                  style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {tab.icon}
                </span>
                <span className="font-headline text-[10px] font-black uppercase tracking-[0.18em]">
                  {tab.label}
                </span>
                <span
                  className={`h-1 rounded-full bg-[var(--primary)] transition-all ${
                    active ? "w-4 opacity-100" : "w-0 opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
