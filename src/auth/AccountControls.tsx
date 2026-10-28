import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { useAccount } from "./runtime";
import { preserveAuthDraft } from "./draft";

export function AccountControls() {
  const { configured, loaded } = useAccount();
  if (!configured) return <span className="hidden font-mono text-[9px] text-muted sm:inline" title="Configure Clerk to enable accounts">Guest mode</span>;
  if (!loaded) return <span role="status" className="font-mono text-[9px] text-muted">Account…</span>;
  return <div className="flex items-center gap-1 normal-case tracking-normal">
    <Show when="signed-out">
      <SignInButton mode="modal" forceRedirectUrl={window.location.href} signUpForceRedirectUrl={window.location.href}><button onClick={preserveAuthDraft} className="nav-link text-xs">Sign in</button></SignInButton>
      <SignUpButton mode="modal" forceRedirectUrl={window.location.href} signInForceRedirectUrl={window.location.href}><button onClick={preserveAuthDraft} className="nav-link hidden text-xs md:inline-flex">Sign up</button></SignUpButton>
    </Show>
    <Show when="signed-in"><UserButton /></Show>
  </div>;
}
