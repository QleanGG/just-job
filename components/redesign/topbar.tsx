import Link from "next/link";
import { AppLogo, Icon, cn } from "@/components/redesign/ui";

export function TopBar({
  showBrand = false,
  searchPlaceholder = "Search",
  filterLabel,
  className,
}: {
  showBrand?: boolean;
  searchPlaceholder?: string;
  filterLabel?: string;
  className?: string;
}) {
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
          <input className="input-shell w-full pl-10 text-sm" placeholder={searchPlaceholder} type="text" />
        </div>

        {filterLabel ? (
          <div className="hidden rounded-full bg-[rgba(25,37,64,0.72)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--on-surface)] lg:flex">
            {filterLabel}
          </div>
        ) : null}

        <div className="flex items-center gap-2 sm:gap-3">
          <button className="glass-panel flex h-10 w-10 items-center justify-center rounded-full text-[var(--on-surface-variant)] transition hover:text-[var(--primary)]" type="button">
            <Icon name="notifications" className="text-[18px]" />
          </button>
          <button className="glass-panel flex h-10 w-10 items-center justify-center rounded-full text-[var(--on-surface-variant)] transition hover:text-[var(--primary)]" type="button">
            <Icon name="account_circle" className="text-[20px]" />
          </button>
        </div>
      </div>
    </header>
  );
}
