import { Check } from "lucide-react";

interface Props {
  busy: boolean;
  error: string | null;
  signedIn: boolean;
  browserCount: number;
  retry?: () => void;
  errorId?: string;
  importBrowser: () => void;
  latestSaveName?: string | null;
  showImport?: boolean;
}
export function SaveStatus({
  busy,
  error,
  signedIn,
  browserCount,
  retry,
  importBrowser,
  latestSaveName,
  errorId,
  showImport = true,
}: Props) {
  const canImport = showImport && signedIn && browserCount > 0;
  if (!error && !latestSaveName && !canImport) return null;
  return (
    <div className="save-status">
      {canImport && (
        <button
          type="button"
          disabled={busy}
          onClick={importBrowser}
          className="save-secondary"
        >
          Import browser builds ({browserCount})
        </button>
      )}
      {error ? (
        <div
          className="save-feedback save-feedback-error"
          role="alert"
          id={errorId}
        >
          <span>{error}</span>
          {retry && (
            <button
              type="button"
              disabled={busy}
              onClick={retry}
              className="save-retry"
            >
              Retry
            </button>
          )}
        </div>
      ) : (
        latestSaveName && (
          <p role="status" className="save-feedback save-feedback-success">
            <Check size={18} aria-hidden="true" />
            <span>
              {latestSaveName}{" "}
              {signedIn ? "saved to your account." : "saved on this device."}
            </span>
          </p>
        )
      )}
    </div>
  );
}
