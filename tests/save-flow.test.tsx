// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { BuildPage } from "../src/Pages/BuildPage";
const { persist } = vi.hoisted(() => ({ persist: vi.fn() }));
vi.mock("../src/hooks/useSavedBuilds", () => ({ useSavedBuilds: () => ({
  savedBuilds: [], saveCount: 0, browserCount: 0, label: "Browser saves", busy: false,
  error: null, signedIn: false, save: persist, remove: vi.fn(), retry: vi.fn(), importBrowser: vi.fn(),
}) }));
vi.mock("../src/components/BuildViewport", () => ({ BuildViewport: () => <div>Hardware viewport</div> }));
vi.mock("../src/Pages/build/DesktopPartsSidebar", () => ({ DesktopPartsSidebar: () => null }));
beforeEach(() => {
  localStorage.clear(); persist.mockReset();
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function openSaves() {
  render(<MemoryRouter initialEntries={["/build"]}><BuildPage /></MemoryRouter>);
  fireEvent.click(screen.getByRole("link", { name: "Saved builds" }));
  return within(screen.getByRole("region", { name: "Build and saves" }));
}
it("opens the saved collection directly from mobile Saved navigation", () => {
  const panel = openSaves();
  expect(panel.getByRole("button", { name: "Hide saved builds" })).toBeTruthy();
  expect(panel.getByText("No saved builds yet")).toBeTruthy();
});
it("focuses the visible mobile naming field on validation failure", async () => {
  const panel = openSaves();
  fireEvent.click(panel.getByRole("button", { name: "Save build" }));
  const input = panel.getByRole("textbox", { name: "Build name" });
  expect(document.activeElement).toBe(input);
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(panel.getByRole("alert").textContent).toMatch(/Give this build a name/);
  expect(panel.queryByRole("button", { name: "Retry" })).toBeNull();
  expect(persist).not.toHaveBeenCalled();
});
it("retains the submitted draft name and reports failure without claiming saved", async () => {
  persist.mockRejectedValue(new Error("Storage is full. Free space and try again."));
  const panel = openSaves();
  fireEvent.change(panel.getByRole("textbox", { name: "Build name" }), { target: { value: "My workstation" } });
  fireEvent.click(panel.getByRole("button", { name: "Save build" }));
  await waitFor(() => expect(panel.getByRole("alert").textContent).toMatch(/Storage is full/));
  expect((panel.getByRole("textbox", { name: "Build name" }) as HTMLInputElement).value).toBe("My workstation");
  expect(panel.queryByRole("status")).toBeNull();
});
