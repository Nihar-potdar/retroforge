import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { partLessons } from "@/data/partLessons";
import type { BUILD, CompatibleComponent, DetailedErrors } from "@/data/type";
import { componentKey } from "@/Logic/Compatibility/CandidateCompatibility";
import { getPartHighlights } from "@/lib/getPartHighlights";
import { componentGroups } from "./buildCatalog";
import {
  CompatibilityFilterToggle,
  type CompatibilityFilterMode,
} from "./CompatibilityFilterToggle";

type Props = {
  category: string;
  onCategory: (value: string) => void;
  parts: CompatibleComponent[];
  build: BUILD;
  search: string;
  onSearch: (value: string) => void;
  filter: CompatibilityFilterMode;
  onFilter: (value: CompatibilityFilterMode) => void;
  issues: ReadonlyMap<string, DetailedErrors[]>;
  onInstall: (part: CompatibleComponent) => void;
  onRemove: (part: CompatibleComponent) => void;
  onPreview: (part: CompatibleComponent) => void;
};
export function PartsCatalog(props: Props) {
  const lesson = partLessons.find((part) => part.id === props.category);
  const categoryMotion = useId();
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <div data-tour="parts" className="catalog-content">
      {lesson && (
        <details className="catalog-education" key={lesson.id}>
          <summary>What does {lesson.name.toLowerCase()} do?</summary>
          <p>{lesson.description}</p>
          <p>
            <strong>Check before choosing: </strong>
            {lesson.check}
          </p>
          <Link to={`/guides/${lesson.guide}`}>
            Learn about {lesson.name.toLowerCase()}
          </Link>
        </details>
      )}
      <div className="catalog-tools">
        <div className="category-controls" data-tour="categories">
          <label className="mobile-category-select text-sm">
            Component category
            <select
              className="text-field mt-2 w-full"
              value={props.category}
              onChange={(event) => {
                setExpanded(null);
                props.onCategory(event.target.value);
              }}
            >
              {componentGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.label}
                </option>
              ))}
            </select>
          </label>
          <div
            className="desktop-category-grid grid grid-cols-2 gap-2"
            aria-label="Component categories"
          >
            {componentGroups.map((group) => (
              <motion.button
                key={group.id}
                whileTap={{ scale: 0.98 }}
                className={`category-button ${group.id === props.category ? "is-active" : ""}`}
                aria-pressed={group.id === props.category}
                onClick={() => {
                  setExpanded(null);
                  props.onCategory(group.id);
                }}
              >
                {group.id === props.category && (
                  <motion.span
                    layoutId={categoryMotion}
                    className="category-active"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <group.icon size={17} aria-hidden="true" />
                {group.label}
              </motion.button>
            ))}
          </div>
        </div>
        <label className="block text-sm">
          Search parts
          <input
            className="text-field mt-2 w-full"
            type="search"
            value={props.search}
            onChange={(e) => props.onSearch(e.target.value)}
            placeholder="Name or brand"
          />
        </label>
        <div className="catalog-filter">
          <CompatibilityFilterToggle
            value={props.filter}
            onChange={props.onFilter}
          />
        </div>
      </div>
      <div className="catalog-list">
        <AnimatePresence initial={false} mode="popLayout">
          {props.parts.map((part) => {
            const key = componentKey(part);
            const installed =
              part.componentType === "Storage"
                ? props.build.STORAGE.some((d) => d.product.id === part.id)
                : props.build[
                    part.componentType.toUpperCase() as Exclude<
                      keyof BUILD,
                      "STORAGE"
                    >
                  ]?.id === part.id;
            const hasCounterpart =
              part.componentType !== "Storage" &&
              Boolean(
                props.build[
                  part.componentType.toUpperCase() as Exclude<
                    keyof BUILD,
                    "STORAGE"
                  >
                ],
              );
            const verb = installed
              ? "Add another"
              : hasCounterpart
                ? "Replace"
                : "Install";
            const issues = props.issues.get(key) ?? [];
            const errorCount = issues.filter((i) => i.type === "error").length;
            return (
              <motion.article
                key={key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: installed ? 5 : 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.16 }}
                className={`part-card ${installed ? "is-installed" : ""}`}
              >
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.12 }}
                  className="part-preview"
                  aria-expanded={expanded === key}
                  onClick={() => {
                    setExpanded(expanded === key ? null : key);
                    props.onPreview(part);
                  }}
                >
                  <span className="font-semibold leading-6">{part.name}</span>
                  <span className="font-mono text-sm">
                    ${part.price.toFixed(2)}
                  </span>
                  <span className="col-span-2 text-xs text-muted">
                    {installed ? "Installed" : part.brand}
                    {issues.length > 0
                      ? ` · ${errorCount ? `${errorCount} compatibility errors` : `${issues.length} warnings`}`
                      : ""}
                  </span>
                </motion.button>
                <div
                  className={`part-specifications ${expanded === key ? "is-expanded" : ""}`}
                >
                  <div className="px-4 pb-3 text-sm">
                    <dl className="space-y-2">
                      {getPartHighlights(part).map((spec) => (
                        <div
                          key={spec.label}
                          className="flex justify-between gap-3"
                        >
                          <dt className="text-muted">{spec.label}</dt>
                          <dd>{spec.value}</dd>
                        </div>
                      ))}
                    </dl>
                    {issues.map((issue) => (
                      <p
                        key={issue.key}
                        className="mt-3 border-l-2 border-warning pl-2"
                      >
                        {issue.compatibilityIssue}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 px-4 pb-4">
                  {(!installed || part.componentType === "Storage") && (
                    <button
                      className="control-button primary flex-1"
                      aria-label={`${verb} ${part.name}`}
                      onClick={(event) => {
                        event.currentTarget
                          .closest("article")
                          ?.querySelector<HTMLButtonElement>("button")
                          ?.focus();
                        props.onInstall(part);
                      }}
                    >
                      {verb}
                    </button>
                  )}
                  {installed && (
                    <button
                      className="control-button flex-1"
                      aria-label={`Remove ${part.name}`}
                      onClick={(event) => {
                        event.currentTarget
                          .closest("article")
                          ?.querySelector<HTMLButtonElement>("button")
                          ?.focus();
                        props.onRemove(part);
                      }}
                    >
                      Remove{part.componentType === "Storage" ? " one" : ""}
                    </button>
                  )}
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
        {props.parts.length === 0 && (
          <p className="p-5 text-muted">
            No matching parts. Try another name or show all parts.
          </p>
        )}
      </div>
    </div>
  );
}
