import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Icon({
  name,
  className,
  fill = false,
}: {
  name: string;
  className?: string;
  fill?: boolean;
}) {
  const style: CSSProperties | undefined = fill
    ? {
        fontVariationSettings: '"FILL" 1, "wght" 500, "GRAD" 0, "opsz" 24',
      }
    : undefined;

  return (
    <span aria-hidden className={cn("material-symbols-outlined", className)} style={style}>
      {name}
    </span>
  );
}

export function AppLogo({
  title = "Just a Job",
  subtitle = "The Digital Tailor",
  compact = false,
}: {
  title?: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dim)] text-[var(--on-primary)] shadow-[0_18px_40px_rgba(0,29,78,0.12)]">
        <Icon name="architecture" fill className="text-[22px]" />
      </div>
      <div className="min-w-0">
        <div className="truncate font-headline text-lg font-extrabold tracking-[-0.03em] text-[var(--on-surface)]">
          {title}
        </div>
        {!compact ? (
          <div className="truncate text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]/70">
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[rgba(25,37,64,0.8)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--primary)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("space-y-4", align === "center" && "mx-auto text-center")}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <div className={cn("space-y-3", align === "center" && "mx-auto max-w-3xl")}>
        <h2 className="font-headline text-3xl font-extrabold tracking-[-0.04em] text-[var(--on-surface)] sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-base leading-7 text-[var(--on-surface-variant)] sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function SurfaceCard({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"div"> & {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("surface-card ghost-border rounded-[1.5rem] p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <SurfaceCard className="space-y-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--on-surface-variant)]">
        {label}
      </div>
      <div className="font-headline text-4xl font-extrabold tracking-[-0.04em] text-[var(--on-surface)]">
        {value}
      </div>
      {hint ? <div className="text-sm text-[var(--on-surface-variant)]">{hint}</div> : null}
    </SurfaceCard>
  );
}

export function MatchRing({
  value,
  size = 56,
  strokeClassName = "text-[var(--primary)]",
}: {
  value: number;
  size?: number;
  strokeClassName?: string;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (circumference * value) / 100;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="-rotate-90" height={size} width={size}>
        <circle
          className="text-[rgba(64,72,93,0.28)]"
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
        />
        <circle
          className={strokeClassName}
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          strokeWidth="4"
        />
      </svg>
      <span className="absolute font-headline text-xs font-bold text-[var(--on-surface)]">{value}%</span>
    </div>
  );
}

export function StatusPill({
  status,
}: {
  status: "Applied" | "Interview" | "Offer" | "Rejected";
}) {
  const tone = {
    Applied: "bg-[rgba(110,155,255,0.14)] text-[var(--secondary)]",
    Interview: "bg-[rgba(129,236,255,0.14)] text-[var(--primary)]",
    Offer: "bg-[rgba(129,236,255,0.18)] text-[var(--primary)]",
    Rejected: "bg-[rgba(255,113,108,0.12)] text-[var(--error)]",
  }[status];

  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]", tone)}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function StepSegments({
  current,
  total = 4,
  className,
}: {
  current: number;
  total?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {Array.from({ length: total }).map((_, index) => {
        const active = index + 1 <= current;
        return (
          <div
            key={index}
            className={cn(
              "h-1.5 rounded-full transition-all duration-200",
              active ? "w-12 bg-[var(--primary)] shadow-[0_0_16px_rgba(129,236,255,0.28)]" : "w-10 bg-[rgba(64,72,93,0.45)]",
            )}
          />
        );
      })}
    </div>
  );
}

export function MiniDocument({
  title,
  accent = "primary",
  className,
}: {
  title: string;
  accent?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-[1.25rem] bg-white p-5 text-[#101621]", className)}>
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1.5",
          accent === "primary" ? "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dim)]" : "bg-gradient-to-r from-[var(--secondary)] to-[var(--primary)]",
        )}
      />
      <div className="space-y-4">
        <div className="space-y-2 pt-3">
          <div className="font-headline text-xl font-extrabold tracking-[-0.04em]">{title}</div>
          <div className="h-1.5 w-1/2 rounded-full bg-slate-300" />
        </div>
        <div className="space-y-2">
          <div className="h-1.5 w-full rounded-full bg-slate-200" />
          <div className="h-1.5 w-11/12 rounded-full bg-slate-200" />
          <div className="h-1.5 w-9/12 rounded-full bg-slate-200" />
        </div>
        <div className="space-y-2">
          <div className="h-1.5 w-4/5 rounded-full bg-slate-300" />
          <div className="h-1.5 w-full rounded-full bg-slate-200" />
          <div className="h-1.5 w-10/12 rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
