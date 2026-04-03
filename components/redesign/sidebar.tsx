"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { AppLogo, Icon, cn } from "@/components/redesign/ui";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", key: "dashboard" },
  { href: "/cvs", label: "My CVs", icon: "description", key: "cvs" },
  { href: "/profile", label: "Settings", icon: "settings", key: "settings" },
] as const;

type SidebarActive = "dashboard" | "cvs" | "settings" | "cta";

export function Sidebar({
  active,
  ctaHref = "/apply",
  ctaLabel = "New Application",
}: {
  active: SidebarActive;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const ctaSelected = active === "cta";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[rgba(64,72,93,0.15)] bg-[rgba(9,19,40,0.96)] px-4 py-8 lg:flex">
      <div className="px-2">
        <AppLogo title="Just a Job" subtitle="The Digital Tailor" />
      </div>

      <Link
        className={cn(
          "mt-10 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200",
          ctaSelected
            ? "bg-[linear-gradient(135deg,rgba(129,236,255,0.18),rgba(0,212,236,0.22))] text-[var(--primary)] shadow-[inset_0_0_0_1px_rgba(129,236,255,0.16)]"
            : "primary-button",
        )}
        href={ctaHref}
      >
        <Icon name="add" className="text-[18px]" />
        {ctaLabel}
      </Link>

      <nav className="mt-10 space-y-2">
        {navItems.map((item) => {
          const selected =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.key}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition duration-200",
                selected
                  ? "bg-[rgba(25,37,64,0.9)] text-[var(--primary)]"
                  : "text-[var(--on-surface-variant)] hover:bg-[rgba(25,37,64,0.55)] hover:text-[var(--on-surface)]",
              )}
              href={item.href}
            >
              <Icon className="text-[20px]" fill={selected} name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 border-t border-[rgba(64,72,93,0.15)] px-2 pt-6">
        <div className="rounded-[1.25rem] bg-[rgba(31,43,73,0.3)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(129,236,255,0.12)] text-[var(--primary)]">
              <span className="font-headline text-sm font-extrabold tracking-[0.12em]">GG</span>
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold text-[var(--on-surface)]">Guy Guzman</div>
              <div className="truncate text-[11px] uppercase tracking-[0.22em] text-[var(--primary)]/70">
                Premium Tailor
              </div>
            </div>
          </div>
        </div>

        {user ? (
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[var(--on-surface-variant)] transition hover:bg-[rgba(25,37,64,0.45)] hover:text-[var(--on-surface)]"
          >
            <Icon className="text-[18px]" name="logout" />
            Sign Out
          </button>
        ) : (
          <Link
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[var(--on-surface-variant)] transition hover:bg-[rgba(25,37,64,0.45)] hover:text-[var(--on-surface)]"
            href="/login"
          >
            <Icon className="text-[18px]" name="login" />
            Sign In
          </Link>
        )}
      </div>
    </aside>
  );
}
