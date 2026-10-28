import { UserButton } from "@clerk/react";
import { useAccount } from "./runtime";
import { SignInAction } from "./SignInAction";

export function AccountControls() {
  const { configured, loaded, userId } = useAccount();
  if (!configured) return <span className="account-guest">Guest</span>;
  if (!loaded || !userId) return <SignInAction />;
  return (
    <div className="account-controls">
      <span className="account-label">Account</span>
      <UserButton />
    </div>
  );
}
