// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { SavedBuilds } from "../src/components/SavedBuilds";
import { SaveStatus } from "../src/components/SaveStatus";
import { AccountControls } from "../src/auth/AccountControls";
import { SignInAction } from "../src/auth/SignInAction";
import { AuthContext, type AuthRuntime } from "../src/auth/runtime";
import { preserveAuthDraft } from "../src/auth/draft";
import { cpus } from "../src/data/cpu";
import { gpus } from "../src/data/gpu";
import { storageDevices } from "../src/data/storage";
import type { SavedBuild } from "../src/data/type";

vi.mock("@clerk/react", () => ({
  SignInButton: ({ children }: { children: ReactNode }) => <>{children}</>,
  SignUpButton: ({ children }: { children: ReactNode }) => <>{children}</>,
  UserButton: () => <button aria-label="Account menu">Account</button>,
}));
vi.mock("../src/auth/draft", () => ({ preserveAuthDraft: vi.fn() }));

const longName =
  "Quiet workstation for editing long documentaries and playing games";
const saved: SavedBuild = {
  id: "save-1",
  name: longName,
  build: {
    CPU: cpus[0],
    GPU: gpus[0],
    STORAGE: [
      { instanceId: "drive-1", product: storageDevices[0] },
      { instanceId: "drive-2", product: storageDevices[0] },
    ],
  },
};
const guest: AuthRuntime = {
  configured: true,
  loaded: true,
  userId: null,
  getToken: async () => null,
};
function Account({
  value = guest,
  children,
}: {
  value?: AuthRuntime;
  children: ReactNode;
}) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
function listProps() {
  return {
    savedBuilds: [saved],
    busy: false,
    label: "Cloud saves",
    expanded: true,
    onExpandedChange: vi.fn(),
    onLoad: vi.fn(),
    onDelete: vi.fn(),
  };
}
function statusProps() {
  return {
    label: "Cloud saves",
    saveCount: 1,
    busy: false,
    error: null,
    signedIn: true,
    browserCount: 0,
    retry: vi.fn(),
    importBrowser: vi.fn(),
  };
}
beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(cleanup);

describe("saved-build collection controls", () => {
  it("keeps the full build name and useful part summaries visible, and forwards exact load/delete targets", () => {
    const props = listProps();
    render(<SavedBuilds {...props} />);
    expect(screen.getByRole("heading", { name: /^Saved builds/ })).toBeTruthy();
    expect(screen.getByText(longName)).toBeTruthy();
    expect(screen.getByText(cpus[0].name)).toBeTruthy();
    expect(screen.getByText(gpus[0].name)).toBeTruthy();
    expect(screen.getByText("4 parts")).toBeTruthy();
    const total = cpus[0].price + gpus[0].price + 2 * storageDevices[0].price;
    expect(screen.getByText(`$${total.toFixed(2)}`)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: `Load ${longName}` }));
    expect(props.onLoad).toHaveBeenCalledWith(saved);
    expect(props.onLoad.mock.calls[0][0]).toBe(saved);
    fireEvent.click(screen.getByRole("button", { name: `Delete ${longName}` }));
    expect(props.onDelete).toHaveBeenCalledWith(saved.id);
  });

  it("shows the latest successful save while keeping delete unavailable during a pending operation", () => {
    const props = { ...listProps(), latestSaveId: saved.id, busy: true };
    render(<SavedBuilds {...props} />);
    expect(screen.getByText("Saved", { exact: true })).toBeTruthy();
    const remove = screen.getByRole("button", { name: `Delete ${longName}` });
    expect((remove as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(remove);
    expect(props.onDelete).not.toHaveBeenCalled();
  });

  it("exposes a named expand control and a useful empty state", () => {
    const props = { ...listProps(), savedBuilds: [], expanded: true };
    const { rerender } = render(<SavedBuilds {...props} />);
    expect(screen.getByText("No saved builds yet")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Hide saved builds" }));
    expect(props.onExpandedChange).toHaveBeenCalledWith(false);
    rerender(<SavedBuilds {...props} expanded={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Show saved builds" }));
    expect(props.onExpandedChange).toHaveBeenCalledWith(true);
  });
});

describe("save feedback", () => {
  it.each([
    [true, "Quiet workstation saved to your account."],
    [false, "Quiet workstation saved on this device."],
  ])(
    "names the completed save and its actual destination (signed in: %s)",
    (signedIn, message) => {
      render(
        <Account>
          <SaveStatus
            {...statusProps()}
            signedIn={signedIn}
            latestSaveName="Quiet workstation"
          />
        </Account>,
      );
      expect(screen.getByText(message)).toBeTruthy();
    },
  );

  it("shows a retryable failure without claiming that the attempted build was saved", () => {
    const props = {
      ...statusProps(),
      error: "Cloud saves are temporarily unavailable.",
      latestSaveName: "Previous success",
    };
    render(
      <Account>
        <SaveStatus {...props} />
      </Account>,
    );
    expect(screen.getByRole("alert").textContent).toContain(props.error);
    expect(screen.queryByText(/saved to your account\./)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(props.retry).toHaveBeenCalledOnce();
  });

  it("offers explicit import only for signed-in accounts and prevents repeated import while busy", () => {
    const props = { ...statusProps(), browserCount: 2, busy: true };
    const { rerender } = render(
      <Account>
        <SaveStatus {...props} />
      </Account>,
    );
    const button = screen.getByRole("button", {
      name: /import browser builds/i,
    });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(props.importBrowser).not.toHaveBeenCalled();
    rerender(
      <Account>
        <SaveStatus {...props} signedIn={false} />
      </Account>,
    );
    expect(
      screen.queryByRole("button", { name: /import browser builds/i }),
    ).toBeNull();
  });
});

describe("account entry points", () => {
  it("provides an obvious sign-in action that preserves the current draft", () => {
    render(
      <Account>
        <SignInAction />
      </Account>,
    );
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(preserveAuthDraft).toHaveBeenCalledOnce();
  });

  it("disables sign-in until account discovery completes", () => {
    render(
      <Account value={{ ...guest, loaded: false }}>
        <SignInAction />
      </Account>,
    );
    const button = screen.getByRole("button", { name: /sign in|account/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(preserveAuthDraft).not.toHaveBeenCalled();
  });

  it("uses guest mode without configured Clerk and account management after sign-in", () => {
    const { rerender } = render(
      <Account value={{ ...guest, configured: false }}>
        <AccountControls />
      </Account>,
    );
    expect(screen.getByText(/guest/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /sign in/i })).toBeNull();
    rerender(
      <Account value={{ ...guest, userId: "user-1" }}>
        <AccountControls />
      </Account>,
    );
    expect(screen.getByRole("button", { name: "Account menu" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /sign in/i })).toBeNull();
  });
});
