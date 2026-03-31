export default function StatusBadge({ status }: { status: string }) {
  const styles = {
    draft: "bg-[var(--color-bg)] text-[var(--color-text-muted)]",
    tailoring: "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
    done: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
    failed: "bg-[var(--color-error)]/10 text-[var(--color-error)]",
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}>
      {status}
    </span>
  );
}
