import { AlertTriangle, Check, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import type {
  CompatibleComponent,
  DetailedErrors,
  InstalledDrive,
} from "@/data/type";
import { getPartHighlights } from "@/lib/getPartHighlights";
import { componentKey } from "@/Logic/Compatibility/CandidateCompatibility";
import { hasCompatibilityErrors } from "@/Logic/Compatibility/Issue";

import type { ComponentGroup } from "./buildCatalog";
import {
  CompatibilityFilterToggle,
  type CompatibilityFilterMode,
} from "./CompatibilityFilterToggle";

type MobilePartsPanelProps = {
  activeGroup: ComponentGroup;
  filteredParts: CompatibleComponent[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedPartKey?: string;
  installedDrives: InstalledDrive[];
  chooseProduct: (part: CompatibleComponent) => void;
  addStorage: (part: CompatibleComponent) => void;
  candidateIssues: ReadonlyMap<string, DetailedErrors[]>;
  compatibilityFilter: CompatibilityFilterMode;
  onCompatibilityFilterChange: (value: CompatibilityFilterMode) => void;
};

export function MobilePartsPanel({
  activeGroup,
  filteredParts,
  searchQuery,
  setSearchQuery,
  selectedPartKey,
  installedDrives,
  chooseProduct,
  addStorage,
  candidateIssues,
  compatibilityFilter,
  onCompatibilityFilterChange,
}: MobilePartsPanelProps) {
  return (
    <>
      <div className="relative px-4 py-3 shrink-0">
        <Search className="absolute -translate-y-1/2 left-7 top-1/2 size-4 text-muted" />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={`SEARCH ${activeGroup.name}`}
          className="h-11 w-full border border-border bg-surface pl-10 pr-3 font-mono text-[10px] uppercase tracking-wide outline-none placeholder:text-muted focus:border-accent"
        />
      </div>

      <div className="px-4 pb-3">
        <CompatibilityFilterToggle
          value={compatibilityFilter}
          onChange={onCompatibilityFilterChange}
        />
      </div>

      <div className="px-3 pb-5">
        <AnimatePresence mode="popLayout">
          {filteredParts.map((part, index) => {
            const key = `${part.componentType}-${part.id}`;
            const issues = candidateIssues.get(componentKey(part)) ?? [];
            const isCompatible = !hasCompatibilityErrors(issues);
            const selected =
              part.componentType === "Storage"
                ? installedDrives.some((drive) => drive.product.id === part.id)
                : selectedPartKey === key;
            const specs = getPartHighlights(part)
              .slice(0, 4)
              .map((item) => item.value);

            return (
              <motion.div
                key={key}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.16 }}
              >
                <motion.button
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${selected ? "Remove" : "Select"} ${part.name}`}
                  onClick={() => chooseProduct(part)}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.12 }}
                  className={`w-full border-l-2 px-4 py-4 text-left ${
                    selected
                      ? "accent-glow border-accent bg-surface"
                      : !isCompatible
                        ? "border-danger/60 bg-danger/5"
                      : "border-transparent border-b border-b-border hover:bg-surface"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted">
                        PART_{String(index + 1).padStart(2, "0")}
                      </p>
                      <p className="mt-1 text-base italic font-bold leading-5 uppercase font-display">
                        {part.name}
                      </p>
                      <p className="mt-2 font-mono text-[9px] uppercase leading-5 text-muted">
                        {specs.join(" / ")}
                      </p>

                      {issues.length > 0 && (
                        <div className={`mt-2 flex items-center gap-1.5 ${isCompatible ? "text-amber-600 dark:text-amber-400" : "text-danger"}`}>
                          <AlertTriangle className="size-3.5 shrink-0" />
                          <span className="font-mono text-[8px] font-bold uppercase tracking-wider">
                            {issues.length} {isCompatible ? (issues.length === 1 ? "warning" : "warnings") : (issues.length === 1 ? "issue" : "issues")}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="font-mono text-sm font-bold">
                        ${part.price.toFixed(2)}
                      </span>

                      {part.componentType === "Storage" && (
                        <span className="font-mono text-[9px] uppercase text-accent-dark">
                          {
                            installedDrives.filter(
                              (drive) => drive.product.id === part.id,
                            ).length
                          }{" "}
                          installed · {selected ? "Remove one" : "Add drive"}
                        </span>
                      )}

                      <AnimatePresence>
                        {selected && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.4, rotate: -30 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
                            transition={{ duration: 0.15 }}
                            className="grid text-white size-6 place-items-center bg-accent"
                          >
                            <Check className="size-3.5" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.button>

                {part.componentType === "Storage" && selected && (
                  <button
                    type="button"
                    onClick={() => addStorage(part)}
                    aria-label={`Add another ${part.name}`}
                    className="w-full min-h-11 border-b border-border px-4 py-2 text-left font-mono text-[10px] uppercase text-accent-dark hover:bg-accent-soft"
                  >
                    + Add another
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredParts.length === 0 && (
          <div className="px-4 py-16 text-center">
            <p className="text-lg italic font-bold uppercase font-display">
              No parts found
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted">
              Adjust your search
            </p>
          </div>
        )}
      </div>
    </>
  );
}
