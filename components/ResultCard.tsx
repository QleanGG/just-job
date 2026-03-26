"use client";

import { useState } from "react";

interface ResultCardProps {
  url: string;
  onReset: () => void;
}

export default function ResultCard({ url, onReset }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Clipboard not available
    }
  };

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-8 text-center">
      <div className="w-12 h-12 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full flex items-center justify-center mx-auto mb-5">
        <svg
          className="w-5 h-5 text-[var(--color-text-secondary)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      <h2 className="text-lg font-medium text-[var(--color-text)] mb-1">
        Your tailored CV is ready
      </h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        Opened in Google Docs
      </p>

      <div className="flex flex-col gap-2.5">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors"
        >
          Open in Google Docs
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>

        <button
          onClick={handleCopy}
          className="px-5 py-2.5 border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
        >
          {copied ? "✓ Link copied" : "Copy link"}
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
        <button
          onClick={onReset}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] underline transition-colors"
        >
          Create another
        </button>
      </div>
    </div>
  );
}
