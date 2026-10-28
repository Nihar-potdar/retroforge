import { motion } from "motion/react";

import type {
  BUILD,
  Category,
  CompatibleComponent,
  SavedBuild,
} from "@/data/type";

type MobileBuildPanelProps = {
  build: BUILD;
  totalPrice: number;
  buildName: string;
  setBuildName: (value: string) => void;
  saveBuild: () => void;
  savesBusy: boolean;
  savedBuilds: SavedBuild[];
  loadBuild: (build: SavedBuild) => void;
  deleteSavedBuild: (id: string) => void;
  removePart: (category: Category) => void;
  removeDrive: (id: string) => void;
  resetBuild: () => void;
};

export function MobileBuildPanel({
  build,
  totalPrice,
  buildName,
  setBuildName,
  resetBuild,
  saveBuild,
  savesBusy,
  savedBuilds,
  loadBuild,
  deleteSavedBuild,
  removePart,
  removeDrive,
}: MobileBuildPanelProps) {
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
      <div className="p-4 border-b border-border">
        <div className="flex gap-2">
          <input
            value={buildName}
            onChange={(event) => setBuildName(event.target.value)}
            placeholder="BUILD NAME"
            className="h-10 min-w-0 flex-1 border border-border bg-surface px-3 font-mono text-[10px] uppercase outline-none focus:border-accent"
          />

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={saveBuild}
            disabled={savesBusy}
            className="px-5 text-xs italic font-bold text-white uppercase cut-corner bg-accent font-display"
          >
            Save
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={resetBuild}
            className="px-5 text-xs italic font-bold text-white uppercase cut-corner bg-accent font-display"
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
                  onClick={() => loadBuild(save)}
                  className="font-mono text-[9px] uppercase text-accent-dark"
                >
                  Load
                </button>
                <button
                  onClick={() => deleteSavedBuild(save.id)}
                  disabled={savesBusy}
                  aria-label={`Delete ${save.name}`}
                  className="font-mono text-xs text-muted hover:text-danger"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        {rows.map(({ category, label, part }) => (
          <div
            key={category}
            className="flex items-center justify-between gap-3 px-4 py-4 border-b border-border"
          >
            <div className="min-w-0">
              <p className="font-mono text-[8px] uppercase tracking-widest text-muted">
                {label}
              </p>
              <p className="mt-1 text-sm italic font-bold uppercase truncate font-display">
                {part?.name ?? "Not installed"}
              </p>
            </div>

            {part && (
              <button
                onClick={() => removePart(category)}
                className="font-mono text-[9px] uppercase text-danger"
              >
                Remove
              </button>
            )}
          </div>
        ))}

        {build.STORAGE.length === 0 && (
          <div className="px-4 py-4 border-b border-border">
            <p className="font-mono text-[8px] uppercase tracking-widest text-muted">
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
              <p className="font-mono text-[8px] uppercase tracking-widest text-muted">
                Storage
              </p>
              <p className="mt-1 text-sm italic font-bold uppercase truncate font-display">
                {drive.product.name}
              </p>
            </div>

            <button
              onClick={() => removeDrive(drive.instanceId)}
              className="font-mono text-[9px] uppercase text-danger"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-end justify-between px-4 py-4 border-t shrink-0 border-accent/30 bg-surface">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-accent-dark">
            Build value
          </p>
          <p className="mt-1 font-mono text-[9px] uppercase text-muted">
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
