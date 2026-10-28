// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { AuthContext, type AuthRuntime } from "../src/auth/runtime";
import { useSavedBuilds } from "../src/hooks/useSavedBuilds";
import { discardAuthDraft, preserveAuthDraft, restoreAuthDraft } from "../src/auth/draft";
import { useBuildStore } from "../src/stores/BuildStore";
import { cpus } from "../src/data/cpu";

const key = "retroforge.savedBuilds";
const local = { id: "guest-original", name: "Guest original", build: { STORAGE: [] } };
let account: AuthRuntime;
function Wrapper({ children }: { children: ReactNode }) { return <AuthContext.Provider value={account}>{children}</AuthContext.Provider>; }
function json(body: unknown) { return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } }); }
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); discardAuthDraft();
  useBuildStore.getState().setBuild({ STORAGE: [] });
  account = { configured: true, loaded: true, userId: null, getToken: async () => "audit-token" };
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("preserves both guest saves issued before React renders again", async () => {
  const { result } = renderHook(useSavedBuilds, { wrapper: Wrapper });
  await act(async () => { await Promise.all([result.current.save("First", { STORAGE: [] }), result.current.save("Second", { STORAGE: [] })]); });
  expect(result.current.savedBuilds.map(build => build.name)).toEqual(["First", "Second"]);
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual(result.current.savedBuilds);
});
it("does not lose a new guest save when an older save is removed in the same render", async () => {
  localStorage.setItem(key, JSON.stringify([local]));
  const { result } = renderHook(useSavedBuilds, { wrapper: Wrapper });
  await act(async () => { await result.current.save("New", { STORAGE: [] }); await result.current.remove(local.id); });
  expect(result.current.savedBuilds.map(build => build.name)).toEqual(["New"]);
});
it("reports blocked guest storage without pretending the save succeeded", async () => {
  localStorage.setItem(key, JSON.stringify([local]));
  const { result } = renderHook(useSavedBuilds, { wrapper: Wrapper });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Storage is full", "QuotaExceededError"); });
  await act(async () => { await expect(result.current.save("Unsaved", { STORAGE: [] })).rejects.toThrow("Storage is full"); });
  expect(result.current.savedBuilds).toEqual([local]);
});
it("does not overwrite edits made after a sign-in modal was opened", () => {
  preserveAuthDraft();
  const edited = { STORAGE: [], CPU: cpus[0] };
  useBuildStore.getState().setBuild(edited);
  restoreAuthDraft();
  expect(useBuildStore.getState().build).toEqual(edited);
  expect(sessionStorage.getItem("retroforge.authDraft")).toBeNull();
});
it("restores valid redirect snapshots and refuses expired or malformed snapshots", () => {
  const snapshot = { STORAGE: [], CPU: cpus[0] };
  sessionStorage.setItem("retroforge.authDraft", JSON.stringify({ expires: Date.now() + 60_000, build: snapshot }));
  restoreAuthDraft();
  expect(useBuildStore.getState().build).toEqual(snapshot);
  for (const raw of ["broken JSON", JSON.stringify({ expires: Date.now() - 1, build: { STORAGE: [] } }), JSON.stringify({ expires: Date.now() + 60_000, build: { CPU: {} } })]) {
    sessionStorage.setItem("retroforge.authDraft", raw);
    restoreAuthDraft();
    expect(useBuildStore.getState().build).toEqual(snapshot);
    expect(sessionStorage.getItem("retroforge.authDraft")).toBeNull();
  }
});
it("serializes cloud writes and ignores an old account's late save response", async () => {
  const pending = deferred<Response>();
  const fetch = vi.fn().mockResolvedValueOnce(json([])).mockImplementationOnce(() => pending.promise).mockResolvedValue(json([]));
  vi.stubGlobal("fetch", fetch);
  account = { ...account, userId: "alice" };
  const { result, rerender } = renderHook(useSavedBuilds, { wrapper: Wrapper });
  await waitFor(() => expect(result.current.busy).toBe(false));
  let saving!: Promise<unknown>;
  await act(async () => { saving = result.current.save("Alice secret", { STORAGE: [] }); await result.current.save("Duplicate", { STORAGE: [] }); });
  expect(fetch).toHaveBeenCalledTimes(2);
  const signal = fetch.mock.calls[1][1].signal as AbortSignal;
  account = { ...account, userId: "bob" }; rerender();
  expect(signal.aborted).toBe(true);
  await waitFor(() => expect(result.current.busy).toBe(false));
  await act(async () => { pending.resolve(json({ id: "alice-private", name: "Alice secret", build: { STORAGE: [] } })); await saving; });
  expect(result.current.savedBuilds).toEqual([]);
  expect(result.current.error).toBeNull();
});
it("rejects expired client sessions before issuing an API request and can retry", async () => {
  const fetch = vi.fn().mockResolvedValue(json([])); vi.stubGlobal("fetch", fetch);
  account = { ...account, userId: "alice", getToken: async () => null };
  const { result, rerender } = renderHook(useSavedBuilds, { wrapper: Wrapper });
  await waitFor(() => expect(result.current.error).toMatch(/session expired/));
  expect(fetch).not.toHaveBeenCalled();
  account = { ...account, getToken: async () => "refreshed-token" }; rerender();
  await waitFor(() => {
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.current.busy).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
it("disables persistence while account discovery is incomplete", async () => {
  account = { ...account, loaded: false };
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const { result } = renderHook(useSavedBuilds, { wrapper: Wrapper });
  expect(result.current.busy).toBe(true);
  await act(async () => { expect(await result.current.save("Too early", { STORAGE: [] })).toBe(false); });
  expect(localStorage.getItem(key)).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});
