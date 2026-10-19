import { AlertTriangle, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "react-router-dom";
import { partLessons } from "@/data/partLessons";

import type { BUILD, CompatibleComponent, DetailedErrors } from "@/data/type";
import { getPartHighlights } from "@/lib/getPartHighlights";
import { componentKey } from "@/Logic/Compatibility/CandidateCompatibility";
import { hasCompatibilityErrors } from "@/Logic/Compatibility/Issue";

import { componentGroups } from "./buildCatalog";
import {
  CompatibilityFilterToggle,
  type CompatibilityFilterMode,
} from "./CompatibilityFilterToggle";

type DesktopPartsSidebarProps = {
  catalogCategory: string;
  filteredParts: CompatibleComponent[];
  selectedPartKey?: string;
  build: BUILD;
  onOpenCategory: (category: string) => void;
  onChooseProduct: (part: CompatibleComponent) => void;
  onAddStorage: (part: CompatibleComponent) => void;
  candidateIssues: ReadonlyMap<string, DetailedErrors[]>;
  compatibilityFilter: CompatibilityFilterMode;
  onCompatibilityFilterChange: (value: CompatibilityFilterMode) => void;
};

export function DesktopPartsSidebar({
  catalogCategory,
  filteredParts,
  selectedPartKey,
  build,
  onOpenCategory,
  onChooseProduct,
  onAddStorage,
  candidateIssues,
  compatibilityFilter,
  onCompatibilityFilterChange,
}: DesktopPartsSidebarProps) {
  const lesson = partLessons.find((part) => part.id === catalogCategory);
  return (
    <aside
      data-tour="parts"
      className="desktop-hardware-catalog hidden h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-r border-border bg-surface lg:flex"
    >
      <div
        data-tour="categories"
        className="shrink-0 border-b border-border bg-border"
      >
        <div className="grid grid-cols-2 gap-px">
          {componentGroups.map((component) => {
            const Icon = component.icon;
            const active = component.id === catalogCategory;

            return (
              <motion.button
                key={component.id}
                type="button"
                aria-label={component.label}
                aria-pressed={active}
                onClick={() => onOpenCategory(component.id)}
                whileTap={{ scale: 0.98 }}
                className={`group relative flex min-h-[58px] items-center gap-3 overflow-hidden px-4 py-3 text-left transition-colors ${
                  active
                    ? "text-white"
                    : "bg-surface text-muted hover:bg-background hover:text-text"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="active-category"
                    className="absolute inset-0 bg-accent"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}

                <Icon
                  className={`relative z-10 size-4 shrink-0 ${
                    active ? "text-white" : "text-muted group-hover:text-text"
                  }`}
                />

                <span className="relative z-10 min-w-0 truncate font-display text-sm font-bold italic uppercase tracking-wide">
                  {component.label}
                </span>

                {active && (
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    className="absolute bottom-0 left-0 right-0 z-10 h-[2px] origin-left bg-white/70"
                  />
                )}
              </motion.button>
            );
          })}

          {componentGroups.length % 2 !== 0 && (
            <div aria-hidden="true" className="min-h-[58px] bg-surface" />
          )}
        </div>
      </div>

      <div className="shrink-0 border-b border-border p-3">
        <CompatibilityFilterToggle
          compact
          value={compatibilityFilter}
          onChange={onCompatibilityFilterChange}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {lesson && (
          <details className="catalog-education" key={lesson.id}>
            <summary>What does this part do?</summary>
            <p>{lesson.description}</p>
            <p>
              <strong>Before choosing: </strong>
              {lesson.check}
            </p>
            <Link to={`/guides/${lesson.guide}`}>
              Learn about {lesson.name.toLowerCase()}
            </Link>
          </details>
        )}
        <AnimatePresence mode="popLayout">
          {filteredParts.map((part) => {
            const key = `${part.componentType}-${part.id}`;
            const issues = candidateIssues.get(componentKey(part)) ?? [];
            const isCompatible = !hasCompatibilityErrors(issues);
            const selected =
              part.componentType === "Storage"
                ? build.STORAGE.some((drive) => drive.product.id === part.id)
                : selectedPartKey === key;
            const specs = getPartHighlights(part)
              .slice(0, 4)
              .map((item) => item.value);

            return (
              <motion.div
                key={key}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: selected ? 5 : 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.16 }}
              >
                <motion.button
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${selected ? "Remove" : "Select"} ${part.name}`}
                  onClick={() => onChooseProduct(part)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.12 }}
                  className={`relative w-full border-l-2 px-4 py-4 text-left [@media(max-height:800px)]:py-3 [@media(max-height:700px)]:py-2 ${
                    selected
                      ? "accent-glow border-accent bg-background"
                      : !isCompatible
                        ? "border-danger/60 bg-danger/5 hover:bg-danger/10"
                        : "border-transparent hover:border-accent/40 hover:bg-background/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="mt-1 text-base italic font-bold uppercase leading-5 font-display [@media(max-height:700px)]:text-sm">
                        {part.name}
                      </p>
                      <p className="mt-1 text-xs text-muted">{part.brand}</p>
                    </div>

                    {selected && (
                      <span className="grid size-6 shrink-0 place-items-center bg-accent text-white">
                        <Check className="size-3.5" />
                      </span>
                    )}
                  </div>

                  <p className="mt-3 font-mono text-[9px] uppercase leading-5 text-muted [@media(max-height:800px)]:mt-2 [@media(max-height:700px)]:hidden">
                    {specs.join(" / ")}
                  </p>

                  {issues.length > 0 && (
                    <div
                      className={`mt-2 flex items-center gap-1.5 ${isCompatible ? "text-amber-600 dark:text-amber-400" : "text-danger"}`}
                    >
                      <AlertTriangle className="size-3.5 shrink-0" />
                      <span className="font-mono text-[8px] font-bold uppercase tracking-wider">
                        {issues.length}{" "}
                        {isCompatible
                          ? issues.length === 1
                            ? "warning"
                            : "warnings"
                          : issues.length === 1
                            ? "issue"
                            : "issues"}
                      </span>
                    </div>
                  )}

                  <div className="mt-3 flex items-end justify-between [@media(max-height:800px)]:mt-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
                      {part.componentType === "Storage"
                        ? `${
                            build.STORAGE.filter(
                              (drive) => drive.product.id === part.id,
                            ).length
                          } installed`
                        : selected
                          ? "Remove"
                          : "Select"}
                    </span>
                    <span className="font-mono text-sm font-bold">
                      ${part.price.toFixed(2)}
                    </span>
                  </div>
                </motion.button>

                {part.componentType === "Storage" && selected && (
                  <button
                    type="button"
                    onClick={() => onAddStorage(part)}
                    className="min-h-11 w-full border-b border-border px-4 py-2 text-left font-mono text-[10px] uppercase text-accent-dark hover:bg-accent-soft"
                  >
                    + Add another
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </aside>
  );
}
