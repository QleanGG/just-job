"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLogo, Icon, cn } from "@/components/redesign/ui";

export function TopBar({
  showBrand = false,
  searchPlaceholder = "Search",
  searchValue,
  onSearchChange,
  filterLabel,
  filterValue,
  filterOptions,
  onFilterChange,
  notificationItems = [],
  className,
}: {
  showBrand?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filterLabel?: string;
  filterValue?: string;
  filterOptions?: Array<{ value: string; label: string }>;
  onFilterChange?: (value: string) => void;
  notificationItems?: Array<{ id: string; title: string; detail: string; onSelect?: () => void }>;
  className?: string;
}) {
  const router = useRouter();
  const notificationRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!showNotifications) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showNotifications]);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-[rgba(64,72,93,0.12)] bg-[rgba(6,14,32,0.7)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="mx-auto flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        {showBrand ? (
          <div className="min-w-fit lg:hidden xl:block">
            <Link href="/">
              <AppLogo compact />
            </Link>
          </div>
        ) : (
          <div className="min-w-fit lg:hidden">
            <Link href="/">
              <AppLogo compact />
            </Link>
          </div>
        )}

        <div className="relative flex-1">
          <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[var(--primary)]/60" name="search" />
          <input
            className="input-shell w-full pl-10 text-sm"
            placeholder={searchPlaceholder}
            type="text"
            value={searchValue}
            onChange={onSearchChange ? (event) => onSearchChange(event.target.value) : undefined}
          />
        </div>

        {filterLabel ? (
          onFilterChange && filterOptions?.length ? (
            <label className="relative hidden overflow-hidden rounded-full bg-[rgba(25,37,64,0.72)] text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--on-surface)] lg:flex lg:items-center">
              <select
                className="appearance-none bg-transparent px-4 py-2 pr-9 outline-none"
                value={filterValue}
                onChange={(event) => onFilterChange(event.target.value)}
                aria-label={filterLabel}
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#101b31] text-white">
                    {option.label}
                  </option>
                ))}
              </select>
              <Icon
                name="expand_more"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-[var(--on-surface-variant)]"
              />
            </label>
          ) : (
            <div className="hidden rounded-full bg-[rgba(25,37,64,0.72)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--on-surface)] lg:flex">
              {filterLabel}
            </div>
          )
        ) : null}

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative" ref={notificationRef}>
            <button
              className="glass-panel relative flex h-10 w-10 items-center justify-center rounded-full text-[var(--on-surface-variant)] transition hover:text-[var(--primary)]"
              type="button"
              aria-expanded={showNotifications}
              aria-haspopup="dialog"
              aria-label="Open notifications"
              onClick={() => setShowNotifications((open) => !open)}
            >
              <Icon name="notifications" className="text-[18px]" />
              {notificationItems.length ? (
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
              ) : null}
            </button>

            {showNotifications ? (
              <div className="absolute right-0 top-12 z-40 w-80 rounded-[1.25rem] border border-white/8 bg-[rgba(9,19,40,0.96)] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
                <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                  Notifications
                </div>
                {notificationItems.length ? (
                  <div className="space-y-1">
                    {notificationItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="w-full rounded-[1rem] px-3 py-3 text-left transition hover:bg-white/5"
                        onClick={() => {
                          item.onSelect?.();
                          setShowNotifications(false);
                        }}
                      >
                        <div className="text-sm font-semibold text-white">{item.title}</div>
                        <div className="mt-1 text-sm text-[var(--on-surface-variant)]">{item.detail}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1rem] px-3 py-4 text-sm text-[var(--on-surface-variant)]">
                    No notifications right now.
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <button
            className="glass-panel flex h-10 w-10 items-center justify-center rounded-full text-[var(--on-surface-variant)] transition hover:text-[var(--primary)]"
            type="button"
            aria-label="Open profile"
            onClick={() => router.push("/profile")}
          >
            <Icon name="account_circle" className="text-[20px]" />
          </button>
        </div>
      </div>
    </header>
  );
}
