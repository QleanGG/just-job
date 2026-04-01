import Link from "next/link";
import { AppLogo, Icon } from "@/components/redesign/ui";

const avatar =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#81ecff" />
          <stop offset="100%" stop-color="#6e9bff" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="32" fill="#192540" />
      <circle cx="32" cy="24" r="12" fill="url(#g)" opacity="0.85" />
      <path d="M14 52c3-9 12-14 18-14s15 5 18 14" fill="url(#g)" opacity="0.75" />
    </svg>
  `);

export default function MobileHeader({
  leftIcon = "menu",
  leftHref = "#",
  logoHref = "/",
  profileSize = "h-10 w-10",
  leftLabel = "Open navigation",
}: {
  leftIcon?: string;
  leftHref?: string;
  logoHref?: string;
  profileSize?: "h-8 w-8" | "h-10 w-10";
  leftLabel?: string;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[rgba(31,43,73,0.6)] shadow-[0_20px_40px_rgba(0,29,78,0.12)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <Link
            href={leftHref}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--primary)] transition hover:bg-white/5"
            aria-label={leftLabel}
          >
            <Icon name={leftIcon} className="text-[24px]" />
          </Link>
          <Link href={logoHref}>
            <AppLogo title="JUST A JOB" subtitle="" compact />
          </Link>
        </div>

        <img
          alt="Profile"
          className={`${profileSize} rounded-full border border-white/10 object-cover`}
          height={40}
          src={avatar}
          width={40}
        />
      </div>
    </header>
  );
}
