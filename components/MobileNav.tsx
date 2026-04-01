"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, cn } from "@/components/redesign/ui";

const tabs = [
  { href: "/", label: "Home", icon: "grid_view" },
  { href: "/dashboard", label: "Applications", icon: "assignment_turned_in" },
  { href: "/cvs", label: "Resumes", icon: "description" },
  { href: "/login", label: "Profile", icon: "account_circle" },
] as const;

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-panel pb-safe fixed inset-x-0 bottom-0 z-50 rounded-t-xl border-t border-white/10 lg:hidden">
      <div className="mx-auto grid h-20 max-w-md grid-cols-4 gap-2 px-4">
        {tabs.map((tab) => {
          const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center justify-center rounded-[1.1rem] px-2 py-2 text-center transition",
                active ? "bg-[#192540] text-[var(--primary)]" : "text-[#6d758c]",
              )}
            >
              <span className="flex flex-col items-center gap-1.5">
                <Icon name={tab.icon} fill={active} className="text-[22px]" />
                <span className="font-headline text-[10px] font-black uppercase tracking-[0.18em]">
                  {tab.label}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
