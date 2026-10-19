import { useState, type ReactNode } from "react";
export function ZenPanel({
  side,
  zen,
  label,
  children,
}: {
  side: "left" | "right";
  zen: boolean;
  label: string;
  children: ReactNode;
}) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <aside
      className={`workspace-panel panel-${side} ${zen ? "is-zen" : ""} ${pinned ? "is-pinned" : ""}`}
      aria-label={label}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      {zen && (
        <button
          className="zen-handle"
          aria-label={`Show ${label}`}
          aria-expanded={pinned || hovered || focused}
          aria-controls={`zen-${side}-content`}
          onClick={() => setPinned(!pinned)}
        >
          {side === "left" ? "Parts ›" : "‹ Build"}
        </button>
      )}
      <div id={`zen-${side}-content`} className="panel-content">
        {children}
      </div>
    </aside>
  );
}
