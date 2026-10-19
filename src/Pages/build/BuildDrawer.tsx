import { Dialog } from "@base-ui/react/dialog";
import { motion, type DragControls } from "motion/react";
import type { ReactNode } from "react";
export function BuildDrawer({
  touring = false,
  panel,
  onClose,
  expanded,
  onExpand,
  onDismissGesture,
  parts,
  build,
}: {
  touring?: boolean;
  panel: "parts" | "build" | null;
  onClose: () => void;
  expanded: boolean;
  onExpand: () => void;
  onDismissGesture: DragControls;
  parts: ReactNode;
  build: ReactNode;
}) {
  if (touring)
    return (
      panel && (
        <aside
          className={`build-drawer ${expanded ? "is-expanded" : ""}`}
          aria-hidden="true"
        >
          <div className="drawer-heading font-semibold">
            {panel === "parts" ? "Choose your parts" : "Your build"}
          </div>
          <div className="drawer-body">
            {panel === "parts" ? (
              parts
            ) : (
              <div data-tour="installed">{build}</div>
            )}
          </div>
        </aside>
      )
    );
  return (
    <Dialog.Root
      open={panel !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="dock-backdrop" />
        <Dialog.Popup
          finalFocus={() =>
            window.matchMedia("(min-width: 1024px)").matches
              ? document.querySelector<HTMLButtonElement>(".panel-left button")
              : undefined
          }
          className={`build-drawer ${expanded ? "is-expanded" : ""}`}
        >
          <motion.div
            drag="y"
            dragControls={onDismissGesture}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (
                info.offset.y > 90 ||
                (info.offset.y > 20 && info.velocity.y > 600)
              )
                onClose();
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div
              className="drawer-heading"
              onPointerDown={(event) => {
                if (!(event.target as HTMLElement).closest("button"))
                  onDismissGesture.start(event);
              }}
            >
              <Dialog.Title className="text-lg font-semibold">
                {panel === "parts" ? "Choose your parts" : "Your build"}
              </Dialog.Title>
              <div className="flex gap-2">
                <button
                  className="control-button"
                  aria-label={
                    expanded ? "Compact panel" : "Expand panel for reading"
                  }
                  onClick={onExpand}
                >
                  {expanded ? "Compact" : "Expand"}
                </button>
                <Dialog.Close
                  className="control-button"
                  aria-label="Close build panel"
                >
                  ×
                </Dialog.Close>
              </div>
            </div>
            <div className="drawer-body">
              {panel === "parts" ? (
                parts
              ) : (
                <div data-tour="installed">{build}</div>
              )}
            </div>
          </motion.div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
