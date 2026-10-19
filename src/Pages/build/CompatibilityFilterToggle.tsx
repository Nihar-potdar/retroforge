export type CompatibilityFilterMode = "all" | "compatible";

type CompatibilityFilterToggleProps = {
  value: CompatibilityFilterMode;
  onChange: (value: CompatibilityFilterMode) => void;
  compact?: boolean;
};

export function CompatibilityFilterToggle({
  value,
  onChange,
  compact = false,
}: CompatibilityFilterToggleProps) {
  return (
    <div
      className="grid grid-cols-2 border border-border bg-background"
      aria-label="Compatibility filter"
      data-ui="compatibility-filter"
    >
      <button
        type="button"
        aria-pressed={value === "all"}
        onClick={() => onChange("all")}
        className={`px-3 py-2 font-mono ${compact ? "text-[9px]" : "min-h-11 text-xs"} font-bold uppercase tracking-wider transition ${
          value === "all"
            ? "bg-[#c82f1b] text-white"
            : "text-muted hover:bg-surface hover:text-text"
        }`}
      >
        All parts
      </button>

      <button
        type="button"
        aria-pressed={value === "compatible"}
        onClick={() => onChange("compatible")}
        className={`border-l border-border px-3 py-2 font-mono ${compact ? "text-[9px]" : "min-h-11 text-xs"} font-bold uppercase tracking-wider transition ${
          value === "compatible"
            ? "bg-[#2452ce] text-white"
            : "text-muted hover:bg-surface hover:text-text"
        }`}
      >
        Compatible only
      </button>
    </div>
  );
}
