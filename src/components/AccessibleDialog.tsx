import { Dialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";

export function AccessibleDialog({
  open,
  onClose,
  title,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Popup className={`accessible-dialog ${className}`}>
          <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
            <Dialog.Title className="font-display text-2xl font-semibold">
              {title}
            </Dialog.Title>
            <Dialog.Close
              className="control-button"
              aria-label={`Close ${title}`}
            >
              ×
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
