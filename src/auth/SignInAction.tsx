import { SignInButton } from "@clerk/react";
import { LoaderCircle, LogIn } from "lucide-react";
import { useAccount } from "./runtime";
import { preserveAuthDraft } from "./draft";

export function SignInAction({ label = "Sign in" }: { label?: string }) {
  const { configured, loaded, userId } = useAccount();
  if (!configured || userId) return null;
  if (!loaded)
    return (
      <button
        type="button"
        className="account-sign-in"
        disabled
        aria-label="Loading account"
      >
        <LoaderCircle size={16} aria-hidden="true" />
        <span>{label}</span>
      </button>
    );
  return (
    <SignInButton
      mode="modal"
      forceRedirectUrl={window.location.href}
      signUpForceRedirectUrl={window.location.href}
    >
      <button
        type="button"
        onClick={preserveAuthDraft}
        className="account-sign-in"
      >
        <LogIn size={16} aria-hidden="true" />
        <span>{label}</span>
      </button>
    </SignInButton>
  );
}
