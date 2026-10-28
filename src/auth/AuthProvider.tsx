import { ClerkProvider, useAuth } from "@clerk/react";
import { shadcn } from "@clerk/ui/themes";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { AuthContext } from "./runtime";
import { discardAuthDraft, restoreAuthDraft } from "./draft";
import { useBuildStore } from "../stores/BuildStore";
import { useIssueStore } from "../stores/ComptiblityIssuesStore";

function SessionBridge({ children }: { children: ReactNode }) {
  const { isLoaded, userId, getToken } = useAuth();
  const previous = useRef<string | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    if (previous.current && previous.current !== userId) {
      discardAuthDraft();
      useBuildStore.getState().setBuild({ STORAGE: [] });
      useIssueStore.getState().clearCompatiblityIssues();
    } else if (userId && !previous.current) restoreAuthDraft();
    previous.current = userId ?? null;
  }, [isLoaded, userId]);
  const value = useMemo(() => ({ configured: true, loaded: isLoaded, userId: userId ?? null, getToken }), [isLoaded, userId, getToken]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!key || !/^pk_(test|live)_/.test(key) || key.includes("replace_me")) return children;
  return <ClerkProvider publishableKey={key} afterSignOutUrl="/" appearance={{ theme: shadcn, variables: {
    colorPrimary: "var(--color-accent)",
    colorPrimaryForeground: "#ffffff",
    colorBackground: "var(--color-surface)",
    colorForeground: "var(--color-text)",
    colorInput: "var(--color-background)",
    colorInputForeground: "var(--color-text)",
    colorNeutral: "var(--color-text)",
    colorMuted: "var(--color-sidebar)",
    colorMutedForeground: "var(--color-muted)",
    colorDanger: "var(--color-danger)",
    colorRing: "var(--color-accent)",
    colorModalBackdrop: "rgba(0, 0, 0, 0.55)",
    borderRadius: "0.25rem", fontFamily: "Space Grotesk, sans-serif",
  } }}>
    <SessionBridge>{children}</SessionBridge>
  </ClerkProvider>;
}
