// @vitest-environment jsdom
import { act } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Root } from "react-dom/client";

const { roots } = vi.hoisted(() => ({ roots: [] as Root[] }));
vi.mock("react-dom/client", async importOriginal => {
  const actual = await importOriginal<typeof import("react-dom/client")>();
  return { ...actual, createRoot: (...args: Parameters<typeof actual.createRoot>) => {
    const root = actual.createRoot(...args);
    roots.push(root);
    return root;
  } };
});
// Keep the entry point and Clerk SDK real; omit unrelated routes and 3D assets.
vi.mock("../src/App.tsx", () => ({ default: () => <p>App mounted</p> }));
vi.mock("../src/index.css", () => ({}));

beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = '<div id="root"></div>';
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});
afterEach(async () => {
  await act(async () => { roots.splice(0).forEach(root => root.unmount()); });
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it.each([undefined, "pk_test_replace_me"])("boots in guest mode with key %s", async key => {
  vi.stubEnv("VITE_CLERK_PUBLISHABLE_KEY", key);
  await act(async () => { await import("../src/main"); });
  expect(document.getElementById("root")?.textContent).toBe("App mounted");
  expect(document.querySelector("script[data-clerk-js-script]")).toBeNull();
});

it("boots with a configured key without nesting Clerk providers", async () => {
  vi.stubEnv("VITE_CLERK_PUBLISHABLE_KEY", `pk_test_${btoa("retroforge-test.clerk.accounts.dev$")}`);
  await act(async () => { await import("../src/main"); });
  expect(document.getElementById("root")?.textContent).toBe("App mounted");
});
