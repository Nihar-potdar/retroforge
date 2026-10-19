import { useState } from "react";
import { AlertTriangle, Check, ChevronDown } from "lucide-react";
import type { Category, DetailedErrors } from "@/data/type";
import { hasCompatibilityErrors, partKey } from "@/Logic/Compatibility/Issue";

type Props = {
  issues: DetailedErrors[];
  expandedByDefault?: boolean;
  onSuggestedAction: (category: Category | "STORAGE") => void;
};

export function CompatibilityIssuesPanel({
  issues,
  onSuggestedAction,
  expandedByDefault = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(expandedByDefault);
  const hasErrors = hasCompatibilityErrors(issues);
  const hasIssues = issues.length > 0;
  const color = hasErrors
    ? "border-danger/50 bg-danger/10 text-danger"
    : hasIssues
      ? "border-warning/50 bg-warning/10 text-warning"
      : "border-success/40 bg-success/10 text-success";

  return (
    <aside className={`border ${color}`}>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2.5">
          {hasIssues ? (
            <AlertTriangle className="size-4" />
          ) : (
            <Check className="size-4" />
          )}
          <span>
            <span className="block font-mono text-xs font-bold uppercase tracking-wider">
              {hasErrors
                ? "Compatibility errors"
                : hasIssues
                  ? "Compatibility warnings"
                  : "No issues found"}
            </span>
            <span className="block text-xs text-muted">
              {issues.filter((entry) => entry.type === "error").length} errors ·{" "}
              {issues.filter((entry) => entry.type === "warning").length}{" "}
              warnings
            </span>
          </span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="space-y-2 border-t border-border/70 p-3">
          {hasIssues ? (
            issues.map((entry) => (
              <CompatibilityIssueCard
                key={entry.key}
                issue={entry}
                expandedByDefault={expandedByDefault}
                onSuggestedAction={onSuggestedAction}
              />
            ))
          ) : (
            <p className="text-xs">
              No supported compatibility problems found in the selected parts.
            </p>
          )}
        </div>
      )}
    </aside>
  );
}

export function CompatibilityIssueCard({
  issue,
  onSuggestedAction,
  expandedByDefault = false,
}: {
  issue: DetailedErrors;
  expandedByDefault?: boolean;
  onSuggestedAction: Props["onSuggestedAction"];
}) {
  const warning = issue.type === "warning";
  return (
    <article
      className={`border bg-background/75 p-3 ${warning ? "border-warning/40" : "border-danger/40"}`}
    >
      <p
        className={`font-mono text-xs font-bold uppercase ${warning ? "text-warning" : "text-danger"}`}
      >
        {issue.type}
      </p>
      <p className="mt-1 text-xs leading-5 text-text">
        {issue.compatibilityIssue}
      </p>
      <button
        type="button"
        onClick={() => onSuggestedAction(issue.suggestedAction)}
        className="mt-2 min-h-11 w-full border border-border px-2.5 py-2 text-left font-mono text-xs uppercase text-accent-dark hover:bg-accent-soft"
      >
        Review {issue.suggestedAction} →
      </button>
      <details
        open={expandedByDefault}
        className="mt-3 border-t border-border/70 pt-2"
      >
        <summary className="cursor-pointer font-mono text-xs uppercase text-muted">
          Detailed overview
        </summary>
        <p className="mt-2 text-xs font-semibold text-text">{issue.title}</p>
        <dl className="mt-2 space-y-2 text-xs">
          {issue.affectedParts.map((part) => (
            <div
              key={partKey(part)}
              className="border border-border bg-surface/60 p-2"
            >
              <dt className="font-medium text-text">{part.name}</dt>
              <dd className="mt-1 text-muted">{part.value}</dd>
            </div>
          ))}
        </dl>
      </details>
    </article>
  );
}
