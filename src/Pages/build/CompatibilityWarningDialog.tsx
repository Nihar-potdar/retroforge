import type { DetailedErrors } from "@/data/type";
import { AccessibleDialog } from "@/components/AccessibleDialog";
export function CompatibilityWarningDialog({
  issues,
  onCancel,
  onConfirm,
}: {
  issues: DetailedErrors[] | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AccessibleDialog
      open={issues !== null}
      onClose={onCancel}
      title="Install despite compatibility errors?"
    >
      <p className="my-4 text-muted">
        These checks found a conflict. Installing anyway keeps the errors
        visible in your build.
      </p>
      <ul className="space-y-3 text-sm">
        {issues?.map((issue) => (
          <li key={issue.key} className="border-l-2 border-danger pl-3">
            {issue.compatibilityIssue}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex justify-end gap-3">
        <button className="control-button" onClick={onCancel}>
          Cancel
        </button>
        <button className="control-button text-danger" onClick={onConfirm}>
          Install anyway
        </button>
      </div>
    </AccessibleDialog>
  );
}
