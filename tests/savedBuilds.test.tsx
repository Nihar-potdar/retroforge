// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { AuthContext, type AuthRuntime } from "../src/auth/runtime";
import { useSavedBuilds } from "../src/hooks/useSavedBuilds";
import { discardAuthDraft, preserveAuthDraft, restoreAuthDraft } from "../src/auth/draft";
import { useBuildStore } from "../src/stores/BuildStore";

const saved = { id: "browser-1", name: "Original", build: { STORAGE: [] } };
let account: AuthRuntime;
function Wrapper({ children }: { children: ReactNode }) { return <AuthContext.Provider value={account}>{children}</AuthContext.Provider>; }
function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }); }
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  account = { configured: true, loaded: true, userId: null, getToken: async () => "test-token" };
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("keeps guest saves local, including loadable snapshots", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const { result } = renderHook(useSavedBuilds, { wrapper: Wrapper });
  await act(async () => { await result.current.save("Guest PC", { STORAGE: [] }); });
  expect(result.current.savedBuilds[0].name).toBe("Guest PC");
  expect(JSON.parse(localStorage.getItem("retroforge.savedBuilds")!)).toEqual(result.current.savedBuilds);
  expect(fetch).not.toHaveBeenCalled();
});
it("surfaces write failures without deleting browser originals", async () => {
  localStorage.setItem("retroforge.savedBuilds", JSON.stringify([saved]));
  account = { ...account, userId: "alice" };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json([])).mockResolvedValueOnce(json({ error: "Database offline" }, 503)));
  const { result } = renderHook(useSavedBuilds, { wrapper: Wrapper });
  await waitFor(() => expect(result.current.busy).toBe(false));
  await act(async () => { await expect(result.current.save("Draft", { STORAGE: [] })).rejects.toThrow("Database offline"); });
  expect(result.current.error).toBe("Database offline");
  expect(result.current.savedBuilds).toEqual([]);
  expect(JSON.parse(localStorage.getItem("retroforge.savedBuilds")!)).toEqual([saved]);
});
it("never exposes a stale account response after switching accounts", async () => {
  let resolveAlice!: (response: Response) => void;
  const fetch = vi.fn().mockImplementationOnce(() => new Promise(resolve => { resolveAlice = resolve; })).mockResolvedValue(json([{ ...saved, id: "bob-build", name: "Bob PC" }]));
  vi.stubGlobal("fetch", fetch);
  account = { ...account, userId: "alice" };
  const { result, rerender } = renderHook(useSavedBuilds, { wrapper: Wrapper });
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  account = { ...account, userId: "bob" }; rerender();
  expect(result.current.savedBuilds).toEqual([]);
  await waitFor(() => expect(result.current.savedBuilds[0]?.name).toBe("Bob PC"));
  await act(async () => { resolveAlice(json([{ ...saved, name: "Alice secret" }])); });
  expect(result.current.savedBuilds[0].name).toBe("Bob PC");
  account = { ...account, userId: null }; rerender();
  expect(result.current.savedBuilds).toEqual([]);
});
it("copies browser saves only on explicit import and retains originals", async () => {
  localStorage.setItem("retroforge.savedBuilds", JSON.stringify([saved]));
  const fetch = vi.fn().mockResolvedValueOnce(json([])).mockResolvedValueOnce(json({ imported: 1, skipped: 0 })).mockResolvedValueOnce(json([{ ...saved, id: "cloud-1" }]));
  vi.stubGlobal("fetch", fetch);
  account = { ...account, userId: "alice" };
  const { result } = renderHook(useSavedBuilds, { wrapper: Wrapper });
  await waitFor(() => expect(result.current.busy).toBe(false));
  expect(fetch).toHaveBeenCalledTimes(1);
  await act(async () => { expect(await result.current.importBrowser()).toEqual({ imported: 1, skipped: 0 }); });
  expect(result.current.savedBuilds[0].id).toBe("cloud-1");
  expect(JSON.parse(localStorage.getItem("retroforge.savedBuilds")!)).toEqual([saved]);
});
it("restores redirect drafts once and discards expired drafts", () => {
  useBuildStore.getState().setBuild({ STORAGE: [] });
  preserveAuthDraft();
  expect(sessionStorage.getItem("retroforge.authDraft")).not.toBeNull();
  restoreAuthDraft();
  expect(useBuildStore.getState().build).toEqual({ STORAGE: [] });
  expect(sessionStorage.getItem("retroforge.authDraft")).toBeNull();
  sessionStorage.setItem("retroforge.authDraft", JSON.stringify({ expires: 1, build: {} }));
  restoreAuthDraft();
  discardAuthDraft();
  expect(sessionStorage.getItem("retroforge.authDraft")).toBeNull();
});
