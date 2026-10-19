import type { PowerBreakdown } from "@/data/type";

export function PowerSummary({
  power,
  psuW,
  expandedByDefault = false,
}: {
  power: PowerBreakdown;
  psuW?: number;
  expandedByDefault?: boolean;
}) {
  return (
    <section
      aria-label="Power estimate"
      className="mb-3 border border-border bg-surface/60 p-3 text-text"
    >
      <p className="font-mono text-[9px] uppercase tracking-wider text-muted">
        {power.isPartial ? "Partial power estimate" : "Estimated stock load"}
        {power.uncertainParts.length > 0 && " · uncertain data"}
      </p>
      <p className="mt-1 font-mono text-sm font-bold">
        {power.estimatedLoadW}W load · {power.recommendedPsuW}W recommended
      </p>
      <p className="mt-1 text-xs text-muted">
        {psuW === undefined ? "No PSU selected" : `${psuW}W PSU selected`}
      </p>
      {power.isPartial && (
        <p className="mt-1 text-xs text-muted">
          Missing: {power.missingComponents.join(", ")}. Add these parts before
          choosing final PSU capacity.
        </p>
      )}
      <details open={expandedByDefault} className="mt-2 text-xs">
        <summary className="cursor-pointer text-accent-dark">
          Power breakdown and assumptions
        </summary>
        <dl className="mt-2 space-y-1">
          {[
            ["CPU power budget", power.cpuW],
            ["GPU board power", power.gpuW],
            ["Motherboard allowance", power.motherboardW],
            ["RAM kit allowance", power.ramW],
            ["Installed drives allowance", power.storageW],
            ["Cooling/accessories allowance", power.accessoriesW],
          ].map(([label, watts]) => (
            <div key={label} className="flex justify-between gap-2">
              <dt>{label}</dt>
              <dd>{watts}W</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-muted">
          Recommendation uses 25% above estimated load
          {power.vendorPsuW > 0
            ? ` or the GPU vendor's ${power.vendorPsuW}W recommendation, whichever is higher`
            : ""}
          . Other components use fixed allowances. Connectors, PSU fit and
          transient compliance are not checked.
        </p>
      </details>
    </section>
  );
}
