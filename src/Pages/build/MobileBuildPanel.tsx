import { motion } from "motion/react";
import { useMemo } from "react";
import { assessBuild } from "@/Logic/Compatibility/BuildAssessment";
import { CompatibilityIssuesPanel } from "@/components/CompatibilityIssuesPanel";
import { PowerSummary } from "@/components/PowerSummary";

import type {
  BUILD,
  Category,
  CompatibleComponent,
  SavedBuild,
} from "@/data/type";

type MobileBuildPanelProps = {
  build: BUILD;
  desktop?: boolean;
  onSuggestedAction: (category: Category | "STORAGE") => void;
  totalPrice: number;
  buildName: string;
  setBuildName: (value: string) => void;
  saveBuild: () => void;
  savedBuilds: SavedBuild[];
  loadBuild: (build: SavedBuild) => void;
  deleteSavedBuild: (id: string) => void;
  removePart: (category: Category) => void;
  removeDrive: (id: string) => void;
  resetBuild: () => void;
};

export function MobileBuildPanel({
  build,
  desktop = false,
  totalPrice,
  onSuggestedAction,
  buildName,
  setBuildName,
  resetBuild,
  saveBuild,
  savedBuilds,
  loadBuild,
  deleteSavedBuild,
  removePart,
  removeDrive,
}: MobileBuildPanelProps) {
  const assessment = useMemo(() => assessBuild(build), [build]);
  const rows: Array<{
    category: Category;
    label: string;
    part: CompatibleComponent | undefined;
  }> = [
    { category: "CPU", label: "Processor", part: build.CPU },
    { category: "GPU", label: "Graphics", part: build.GPU },
    { category: "MOTHERBOARD", label: "Motherboard", part: build.MOTHERBOARD },
    { category: "RAM", label: "Memory", part: build.RAM },
    { category: "PSU", label: "Power", part: build.PSU },
    { category: "CASE", label: "Case", part: build.CASE },
  ];

  return (
    <>
      {desktop && (
        <div className="p-4 border-b border-border">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Build status
          </p>
          <h2 className="mt-1 text-xl italic font-bold uppercase font-display">
            Your machine
          </h2>
          <p className="mt-2 text-sm text-accent-dark">
            {
              [
                build.CPU,
                build.GPU,
                build.MOTHERBOARD,
                build.RAM,
                build.PSU,
                build.CASE,
                build.STORAGE.length > 0,
              ].filter(Boolean).length
            }
            /7 categories installed
          </p>
          <p className="mt-2 text-sm">
            Estimated parts total{" "}
            <strong className="float-right">${totalPrice.toFixed(2)}</strong>
          </p>
        </div>
      )}
      {!desktop && (
        <div className="p-4 border-b border-border">
          <p className="mb-3 text-sm text-muted">
            Estimated parts total{" "}
            <strong className="float-right text-text">
              ${totalPrice.toFixed(2)}
            </strong>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={buildName}
              onChange={(event) => setBuildName(event.target.value)}
              aria-label="Build name"
              placeholder="Build name"
              className="col-span-2 h-11 min-w-0 w-full border border-border bg-surface px-3 font-mono text-sm uppercase outline-none focus:border-accent"
            />

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={saveBuild}
              className="min-h-11 px-5 text-sm italic font-bold text-white uppercase cut-corner bg-accent font-display"
            >
              Save
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={resetBuild}
              className="min-h-11 px-5 text-sm italic font-bold text-white uppercase cut-corner bg-accent font-display"
            >
              Reset
            </motion.button>
          </div>

          {savedBuilds.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {savedBuilds.map((save) => (
                <div
                  key={save.id}
                  className="flex items-center gap-2 px-3 py-2 border shrink-0 border-border bg-surface"
                >
                  <span className="text-xs italic font-bold uppercase font-display">
                    {save.name}
                  </span>
                  <button
                    aria-label={`Load ${save.name}`}
                    onClick={() => loadBuild(save)}
                    className="font-mono text-xs uppercase text-accent-dark"
                  >
                    Load
                  </button>
                  <button
                    aria-label={`Delete saved build ${save.name}`}
                    onClick={() => deleteSavedBuild(save.id)}
                    className="font-mono text-xs text-muted hover:text-danger"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="p-4" data-tour={desktop ? undefined : "power"}>
        {!desktop && (
          <PowerSummary power={assessment.power} psuW={build.PSU?.wattage} />
        )}
        <CompatibilityIssuesPanel
          expandedByDefault={desktop}
          issues={assessment.issues}
          onSuggestedAction={onSuggestedAction}
        />
      </div>

      <div>
        {rows.map(({ category, label, part }) => (
          <div
            key={category}
            className="flex items-center justify-between gap-3 px-4 py-4 border-b border-border"
          >
            <div className="min-w-0">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                {label}
              </p>
              <p className="mt-1 text-sm italic font-bold uppercase truncate font-display">
                <span>{part?.name ?? "Not installed"}</span>
                {desktop && part && (
                  <span className="mt-1 block font-mono text-xs font-normal not-italic text-muted">
                    ${part.price.toFixed(2)}
                  </span>
                )}
              </p>
            </div>

            {part && (
              <button
                aria-label={`Remove ${part?.name ?? label}`}
                onClick={(event) => {
                  event.currentTarget
                    .closest(".panel-content, .drawer-body")
                    ?.querySelector<HTMLInputElement>("input")
                    ?.focus();
                  if (desktop)
                    document.getElementById("desktop-build-name")?.focus();
                  removePart(category);
                }}
                className="font-mono text-xs uppercase text-danger"
              >
                Remove
              </button>
            )}
          </div>
        ))}

        {build.STORAGE.length === 0 && (
          <div className="px-4 py-4 border-b border-border">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Storage
            </p>
            <p className="mt-1 text-sm italic font-bold uppercase font-display text-muted">
              Not installed
            </p>
          </div>
        )}

        {build.STORAGE.map((drive) => (
          <div
            key={drive.instanceId}
            className="flex items-center justify-between gap-3 px-4 py-4 border-b border-border"
          >
            <div className="min-w-0">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Storage
              </p>
              <p className="mt-1 text-sm italic font-bold uppercase truncate font-display">
                <span>{drive.product.name}</span>
                {desktop && (
                  <span className="mt-1 block font-mono text-xs font-normal not-italic text-muted">
                    ${drive.product.price.toFixed(2)}
                  </span>
                )}
              </p>
            </div>

            <button
              aria-label={`Remove ${drive.product.name}`}
              onClick={(event) => {
                event.currentTarget
                  .closest(".panel-content, .drawer-body")
                  ?.querySelector<HTMLInputElement>("input")
                  ?.focus();
                if (desktop)
                  document.getElementById("desktop-build-name")?.focus();
                removeDrive(drive.instanceId);
              }}
              className="font-mono text-xs uppercase text-danger"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      {desktop && (
        <div className="p-4" data-tour="power">
          <PowerSummary
            power={assessment.power}
            psuW={build.PSU?.wattage}
            expandedByDefault
          />
        </div>
      )}

      <div className="flex items-end justify-between px-4 py-4 border-t shrink-0 border-accent/30 bg-surface">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent-dark">
            Build value
          </p>
          <p className="mt-1 font-mono text-xs uppercase text-muted">
            Current configuration
          </p>
        </div>

        <span className="text-2xl italic font-bold font-display">
          ${totalPrice.toFixed(2)}
        </span>
      </div>
    </>
  );
}
