import { Check, Cloud, HardDrive, LoaderCircle } from "lucide-react";
import { SignInAction } from "../auth/SignInAction";

interface Props {
  label: string;
  saveCount: number;
  busy: boolean;
  error: string | null;
  signedIn: boolean;
  browserCount: number;
  retry?: () => void;
  errorId?: string;
  importBrowser: () => void;
  latestSaveName?: string | null;
}
export function SaveStatus({
  label,
  busy,
  error,
  signedIn,
  browserCount,
  retry,
  importBrowser,
  latestSaveName,
  errorId,
}: Props) {
  const Icon = signedIn ? Cloud : HardDrive;
  return (
    <div className="save-status">
      <div className="save-status-copy">
        <Icon size={18} aria-hidden="true" />
        <div>
          <p className="save-status-title">
            {label}
            {busy && (
              <span className="save-working">
                <LoaderCircle size={14} aria-hidden="true" />
                Working…
              </span>
            )}
          </p>
          <p className="save-status-help">
            {signedIn
              ? "Open your saved builds whenever you sign in."
              : "Keep builds on this device, or sign in to save them to your account."}
          </p>
        </div>
      </div>
      {!signedIn && <SignInAction label="Sign in to save" />}
      {signedIn && browserCount > 0 && (
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
