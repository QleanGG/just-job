"use client";

import { useState } from "react";
import { CVSection, TailoredSection, JobListing } from "@/lib/types";

interface DiffViewProps {
  originalSections: CVSection[];
  tailoredSections: TailoredSection[];
  job: JobListing | null;
}

function highlightChanges(original: string, tailored: string): React.ReactNode {
  // Simple word-level diff: split by spaces and highlight differences
  const origWords = original.split(/(\s+)/);
  const tailWords = tailored.split(/(\s+)/);

  // Find longest common subsequence for simple highlighting
  const origSet = new Set(origWords.filter(w => w.trim()));
  const tailSet = new Set(tailWords.filter(w => w.trim()));

  const highlightedTail = tailWords.map((word, i) => {
    const clean = word.trim();
    if (!clean || !/\w/.test(clean)) return word;
    if (!origSet.has(clean) && tailSet.has(clean)) {
      return <mark key={i} className="bg-[var(--color-accent)]/30 text-[var(--color-accent)] rounded px-0.5">{word}</mark>;
    }
    return word;
  });

  return highlightedTail;
}

export default function DiffView({
  originalSections,
  tailoredSections,
  job,
}: DiffViewProps) {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const hasTailored = tailoredSections.length > 0;

  // Build a map of original content by index
  const originalMap = new Map(
    originalSections.map(s => [s.originalIndex, s])
  );

  return (
    <div className="space-y-3">
      {job && (
        <div className="px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
          <p className="text-xs text-[var(--color-text-muted)]">
            Tailoring for{" "}
            <span className="text-[var(--color-text)] font-medium">{job.title}</span>
            {job.company && <span> at {job.company}</span>}
          </p>
        </div>
      )}

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)]">
        {hasTailored ? (
          // BEFORE / AFTER view
          tailoredSections.map((section, idx) => {
            const original = originalMap.get(section.originalIndex);
            const hasChanges = section.changes.length > 0;

            return (
              <div key={idx}>
                <button
                  onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[var(--color-bg)]/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        hasChanges
                          ? "bg-[var(--color-accent)]"
                          : "bg-[var(--color-success)]"
                      }`}
                    />
                    <span className="text-sm font-medium text-[var(--color-text)]">
                      {section.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasChanges ? (
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {section.changes.length} change{section.changes.length !== 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--color-success)]">No changes</span>
                    )}
                    <svg
                      className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${
                        expandedSection === idx ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandedSection === idx && (
                  <div className="px-4 pb-5">
                    {/* Two-column BEFORE / AFTER */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* BEFORE column */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                            Before
                          </span>
                        </div>
                        <div className="p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg">
                          <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
                            {original?.content || section.content || "(empty)"}
                          </p>
                        </div>
                      </div>

                      {/* AFTER column */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-[var(--color-accent)] uppercase tracking-wide">
                            After
                          </span>
                        </div>
                        <div className="p-3 bg-[var(--color-bg)] border border-[var(--color-accent)]/30 rounded-lg">
                          <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">
                            {highlightChanges(original?.content || "", section.content)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Change list */}
                    {hasChanges && (
                      <div className="mt-4">
                        <p className="text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
                          What changed
                        </p>
                        <div className="space-y-2">
                          {section.changes
                            .filter(c => c.changeType !== "keep")
                            .slice(0, 5)
                            .map((change, cidx) => (
                              <div key={cidx} className="flex gap-2 text-xs">
                                <span className="shrink-0 mt-0.5 px-1.5 py-0.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                                  {change.changeType}
                                </span>
                                <div className="flex-1 space-y-0.5">
                                  {change.original && (
                                    <p className="text-[var(--color-text-secondary)] line-through opacity-60">
                                      {change.original}
                                    </p>
                                  )}
                                  {change.tailored && (
                                    <p className="text-[var(--color-text)]">
                                      → {change.tailored}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          // No tailored sections — just show original as one column
          originalSections.map((section, idx) => (
            <div key={idx}>
              <button
                onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[var(--color-bg)]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)]" />
                  <span className="text-sm font-medium text-[var(--color-text)]">
                    {section.title}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${
                    expandedSection === idx ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedSection === idx && (
                <div className="px-4 pb-5">
                  <div className="p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg">
                    <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">
                      {section.content || "(empty)"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
