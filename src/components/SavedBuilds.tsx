import { useEffect, useId, useRef } from "react";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronDown,
  Trash2,
} from "lucide-react";
import type { SavedBuild } from "../data/type";

interface Props {
  savedBuilds: SavedBuild[];
  busy: boolean;
  label: string;
  latestSaveId?: string | null;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onLoad: (build: SavedBuild) => void;
  onDelete: (id: string) => void;
}

export function SavedBuilds({
  savedBuilds,
  busy,
  label,
  latestSaveId,
  expanded,
  onExpandedChange,
  onLoad,
  onDelete,
}: Props) {
  const id = useId();
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (expanded && latestSaveId) scroll.current?.scrollTo?.({ left: 0 });
  }, [expanded, latestSaveId]);
  return (
    <section className="saved-builds" aria-label="Saved builds">
      <header className="saved-builds-heading">
        <div>
          <h2>
            <Bookmark size={18} aria-hidden="true" />
            Saved builds{" "}
            <span className="saved-builds-count">{savedBuilds.length}</span>
          </h2>
          <p>
            {label === "Cloud saves" ? "In your account" : "On this browser"}
          </p>
        </div>
        <button
          type="button"
          className="save-secondary"
          aria-expanded={expanded}
          aria-controls={id}
          aria-label={expanded ? "Hide saved builds" : "Show saved builds"}
          onClick={() => onExpandedChange(!expanded)}
        >
          {expanded ? "Hide" : "View builds"}
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={expanded ? "saved-builds-chevron-open" : undefined}
          />
        </button>
      </header>
      {expanded && (
        <div id={id} className="saved-builds-content">
          {savedBuilds.length === 0 ? (
            <div className="saved-builds-empty">
              <h3>No saved builds yet</h3>
              <p>
                Name your build, then choose Save build. It will appear here.
              </p>
            </div>
          ) : (
            <div className="saved-builds-list" ref={scroll}>
              {[...savedBuilds].reverse().map((save) => {
                const parts = [
                  save.build.CPU,
                  save.build.GPU,
                  save.build.RAM,
                  save.build.PSU,
                  save.build.CASE,
                  save.build.MOTHERBOARD,
                  ...save.build.STORAGE.map((drive) => drive.product),
                ].filter((part) => part !== undefined);
                const total = parts.reduce((sum, part) => sum + part.price, 0);
                const latest = save.id === latestSaveId;
                return (
                  <article
                    key={save.id}
                    className={`saved-build-card${latest ? " saved-build-card-latest" : ""}`}
                  >
                    <div className="saved-build-card-title">
                      <h3 title={save.name}>{save.name}</h3>
                      {latest && (
                        <span className="saved-build-badge">
                          <Check size={14} aria-hidden="true" />
                          Saved
                        </span>
                      )}
                    </div>
                    <dl className="saved-build-specs">
                      <div>
                        <dt>CPU</dt>
                        <dd>
                          {save.build.CPU?.name ?? "No processor selected"}
                        </dd>
                      </div>
                      <div>
                        <dt>GPU</dt>
                        <dd>
                          {save.build.GPU?.name ?? "No graphics card selected"}
                        </dd>
                      </div>
                    </dl>
                    <div className="saved-build-card-meta">
                      <span>
                        {parts.length} {parts.length === 1 ? "part" : "parts"}
                      </span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="saved-build-card-actions">
                      <button
                        type="button"
                        className="save-load"
                        aria-label={`Load ${save.name}`}
                        onClick={() => onLoad(save)}
                      >
                        Load build
                        <ArrowUpRight size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="save-delete"
                        aria-label={`Delete ${save.name}`}
                        disabled={busy}
                        onClick={() => onDelete(save.id)}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
