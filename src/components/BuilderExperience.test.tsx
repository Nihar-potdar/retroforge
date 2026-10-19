// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Onboarding } from "./Onboarding";
import { AccessibleDialog } from "./AccessibleDialog";
import { PartsCatalog } from "@/Pages/build/PartsCatalog";
import { cpus } from "@/data/cpu";
import { cameraKey } from "./cameraControls";
import { BuildDrawer } from "@/Pages/build/BuildDrawer";
import type { DragControls } from "motion/react";
beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);
describe("welcome and accessible dialogs", () => {
  it("shows a new-version welcome, dismisses, and can replay through Help", async () => {
    const user = userEvent.setup();
    const view = render(
      <MemoryRouter initialEntries={["/build"]}>
        <Onboarding />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "Welcome to RetroForge",
    );
    await user.click(screen.getByRole("button", { name: /^Close$/ }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(localStorage.getItem("retroforge.onboarding.v1")).toBe("dismissed");
    view.unmount();
    render(
      <MemoryRouter initialEntries={["/build"]}>
        <Onboarding />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    window.dispatchEvent(new Event("retroforge:help"));
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "Keyboard controls",
    );
  });
  it("contains focus and handles Escape", async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    render(
      <>
        <button>Background action</button>
        <AccessibleDialog open onClose={close} title="Review">
          <button>First choice</button>
          <button>Last choice</button>
        </AccessibleDialog>
      </>,
    );
    const dialog = await screen.findByRole("dialog");
    await waitFor(() =>
      expect(dialog.contains(document.activeElement)).toBe(true),
    );
    for (let i = 0; i < 7; i++) {
      await user.tab();
      await waitFor(() =>
        expect(dialog.contains(document.activeElement)).toBe(true),
      );
    }
    await user.keyboard("{Escape}");
    expect(close).toHaveBeenCalled();
  });
});
it("a product preview never installs, and explicit install/remove are keyboard reachable", async () => {
  const user = userEvent.setup();
  const install = vi.fn(),
    remove = vi.fn(),
    preview = vi.fn();
  const cpu = cpus[0]!;
  const props = {
    category: "cpu",
    onCategory: vi.fn(),
    parts: [cpu],
    build: { STORAGE: [] },
    search: "",
    onSearch: vi.fn(),
    filter: "all" as const,
    onFilter: vi.fn(),
    issues: new Map(),
    onInstall: install,
    onRemove: remove,
    onPreview: preview,
  };
  const view = render(<PartsCatalog {...props} />, { wrapper: MemoryRouter });
  await user.click(
    screen.getAllByRole("button", { name: new RegExp(cpu.name) })[0]!,
  );
  expect(preview).toHaveBeenCalledWith(cpu);
  expect(install).not.toHaveBeenCalled();
  const installButton = screen.getByRole("button", {
    name: `Install ${cpu.name}`,
  });
  installButton.focus();
  await user.keyboard("{Enter}");
  expect(install).toHaveBeenCalledWith(cpu);
  view.rerender(<PartsCatalog {...props} build={{ CPU: cpu, STORAGE: [] }} />);
  const removeButton = screen.getByRole("button", {
    name: `Remove ${cpu.name}`,
  });
  removeButton.focus();
  await user.keyboard(" ");
  expect(remove).toHaveBeenCalledWith(cpu);
});
it("a drawer has named expand, close and keyboard dismissal controls", async () => {
  const user = userEvent.setup();
  const close = vi.fn(),
    expand = vi.fn();
  render(
    <BuildDrawer
      panel="parts"
      expanded={false}
      onExpand={expand}
      onClose={close}
      onDismissGesture={
        { subscribe: () => () => {}, start: vi.fn() } as unknown as DragControls
      }
      parts={<button>Install part</button>}
      build={<p>Build</p>}
    />,
  );
  const dialog = await screen.findByRole("dialog");
  await user.click(
    within(dialog).getByRole("button", { name: "Expand panel for reading" }),
  );
  expect(expand).toHaveBeenCalled();
  await user.keyboard("{Escape}");
  expect(close).toHaveBeenCalled();
});
it("camera shortcuts are local and do not interpret ordinary typing", () => {
  expect(cameraKey("ArrowLeft")).toBe("left");
  expect(cameraKey("Home")).toBe("reset");
  expect(cameraKey("+")).toBe("in");
  expect(cameraKey("s")).toBeNull();
});
