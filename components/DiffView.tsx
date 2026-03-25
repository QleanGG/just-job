"use client";

import { useState } from "react";
import { CVSection, TailoredSection, JobListing } from "@/lib/types";

interface DiffViewProps {
  originalSections: CVSection[];
  tailoredSections: TailoredSection[];
  job: JobListing | null;
}

export default function DiffView({
  originalSections,
  tailoredSections,
  job,
}: DiffViewProps) {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const hasTailored = tailoredSections.length > 0;
  const displaySections = hasTailored ? tailoredSections : originalSections.map(s => ({ ...s, changes: [] }));

  return (
    <div className="space-y-3">
      {job && (
        <div className="px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
          <p className="text-xs text-[var(--color-text-muted)]">
            Tailoring for{" "}
            <span className="text-[var(--color-text)] font-medium">{job.title}</span>
            {job.company && (
              <span> at {job.company}</span>
            )}
          </p>
        </div>
      )}

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)]">
        {displaySections.map((section, idx) => (
          <div key={idx}>
            <button
              onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
              className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[var(--color-bg)]/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {hasTailored && (
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      section.changes.length > 0
                        ? "bg-[var(--color-accent)]"
                        : "bg-[var(--color-text-muted)]"
                    }`}
                  />
                )}
                <span className="text-sm font-medium text-[var(--color-text)]">
                  {section.title}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {hasTailored && section.changes.length > 0 && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {section.changes.length} change{section.changes.length !== 1 ? "s" : ""}
                  </span>
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
                {!hasTailored ? (
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">Current content</p>
                    <div className="p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg">
                      <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">
                        {section.content || "(empty)"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Changes */}
                    {section.changes.filter(c => c.changeType !== "keep").length > 0 && (
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)] mb-2">Changes</p>
                        <div className="space-y-2">
                          {section.changes
                            .filter(c => c.changeType !== "keep")
                            .map((change, cidx) => (
                              <div key={cidx} className="space-y-1">
                                {change.original && (
                                  <div className="px-3 py-2 bg-[var(--color-bg)] border-l-2 border-[var(--color-text-muted)] rounded-r text-xs">
                                    <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] mr-2">
                                      {change.changeType}
                                    </span>
                                    <span className="text-[var(--color-text-secondary)]">
                                      {change.original}
                                    </span>
                                  </div>
                                )}
                                {change.tailored && (
                                  <div className="px-3 py-2 bg-[var(--color-bg)] border-l-2 border-[var(--color-accent)] rounded-r text-xs">
                                    <span className="text-[10px] uppercase tracking-wide text-[var(--color-accent)] mr-2">
                                      →
                                    </span>
                                    <span className="text-[var(--color-text)]">
                                      {change.tailored}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* New content */}
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)] mb-2">
                        {hasTailored ? "New content" : "Current content"}
                      </p>
                      <div className="p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg">
                        <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
