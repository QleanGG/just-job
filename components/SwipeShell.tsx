"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

export interface Tab {
  path: string;
  label: string;
  icon: string;
}

interface SwipeShellProps {
  tabs: readonly Tab[];
  initialPanel?: number;
  panels?: ReactNode[];
  children?: ReactNode;
}

export default function SwipeShell({ tabs, initialPanel = 0, panels, children }: SwipeShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(initialPanel);
  const [isDragging, setIsDragging] = useState(false);
  const isProgrammaticScroll = useRef(false);

  // Sync active tab from pathname
  useEffect(() => {
    const idx = tabs.findIndex(
      (t) => t.path === pathname || (t.path !== "/" && pathname.startsWith(t.path)),
    );
    if (idx !== -1 && idx !== activeIndex) {
      setActiveIndex(idx);
    }
  }, [pathname]);

  function scrollToIndex(idx: number, updateRouter = true) {
    const container = containerRef.current;
    if (!container) return;
    const child = container.children[idx] as HTMLElement;
    if (!child) return;
    isProgrammaticScroll.current = true;
    container.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
    if (updateRouter) {
      router.push(tabs[idx].path, { scroll: false });
    }
    setTimeout(() => { isProgrammaticScroll.current = false; }, 500);
  }

  function handleScroll() {
    if (isProgrammaticScroll.current || isDragging) return;
    const container = containerRef.current;
    if (!container) return;
    const childWidth = container.children[0]?.clientWidth || window.innerWidth;
    const idx = Math.round(container.scrollLeft / childWidth);
    if (idx !== activeIndex && idx >= 0 && idx < tabs.length) {
      setActiveIndex(idx);
      router.replace(tabs[idx].path, { scroll: false });
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
    const clamped = Math.max(0, Math.min(idx, tabs.length - 1));
    setActiveIndex(clamped);
    scrollToIndex(clamped);
  }

  const childArray = panels
    ? panels
    : children
      ? (Array.isArray(children) ? children : [children])
      : [];

  return (
    <div className="fixed inset-0 flex flex-col bg-[var(--background)]">
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
        {childArray.map((child, i) => (
          <div
            key={i}
            className="min-w-full shrink-0 snap-center overflow-y-auto"
          >
            {child}
          </div>
        ))}
      </div>

      {/* Bottom tab bar */}
      <nav className="glass-panel pb-safe fixed inset-x-0 bottom-0 z-50 rounded-t-xl border-t border-white/10 lg:hidden">
        <div className="mx-auto grid h-20 max-w-md grid-cols-3 gap-2 px-4">
          {tabs.map((tab, i) => {
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
