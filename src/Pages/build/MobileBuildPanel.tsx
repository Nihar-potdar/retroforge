import type { ReactNode, RefObject } from "react";
import { SavedBuilds } from "@/components/SavedBuilds";

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
  saving: boolean;
  nameInputRef: RefObject<HTMLInputElement | null>;
  saveError: string | null;
  savesLabel: string;
  latestSaveId?: string;
  savedExpanded: boolean;
  setSavedExpanded: (expanded: boolean) => void;
  saveStatus: ReactNode;
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
  saving,
  nameInputRef,
  saveError,
  savesLabel,
  latestSaveId,
  savedExpanded,
  setSavedExpanded,
  saveStatus,
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
    <section aria-label="Build and saves">
      <div className="p-4 border-b border-border">
        <div className="build-save-composer">
          <label className="build-save-field">
            <span>Build name</span>
            <input
              ref={nameInputRef}
              aria-invalid={!!saveError}
              aria-describedby={
                saveError ? "build-save-error-mobile" : undefined
              }
              value={buildName}
              maxLength={120}
              onChange={(event) => setBuildName(event.target.value)}
              placeholder="Name your build"
            />
          </label>
          <button
            type="button"
            onClick={saveBuild}
            disabled={savesBusy}
            className="save-primary"
          >
            {saving ? "Saving…" : savesBusy ? "Please wait…" : "Save build"}
          </button>
        </div>
        <button
          type="button"
          onClick={resetBuild}
          className="save-secondary mt-3"
        >
          Reset build
        </button>
      </div>
      {saveStatus}
      <SavedBuilds
        savedBuilds={savedBuilds}
        busy={savesBusy}
        label={savesLabel}
        latestSaveId={latestSaveId}
        expanded={savedExpanded}
        onExpandedChange={setSavedExpanded}
        onLoad={loadBuild}
        onDelete={deleteSavedBuild}
      />

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
    </section>
  );
}
