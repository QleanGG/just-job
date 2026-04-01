import Link from "next/link";
import { Icon } from "@/components/redesign/ui";

export default function MobileFAB() {
  return (
    <Link
      href="/apply/step1"
      className="fixed bottom-24 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dim)] text-[var(--on-primary)] shadow-xl lg:hidden"
      aria-label="Start a new application"
    >
      <Icon name="add" className="text-3xl" />
    </Link>
  );
}
