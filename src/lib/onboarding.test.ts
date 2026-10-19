import { beforeEach, expect, it, vi } from "vitest";
beforeEach(() => vi.resetModules());
it("existing users see the new welcome even when unrelated old settings exist", async () => {
  const { shouldShowWelcome } = await import("./onboarding");
  const storage = { getItem: vi.fn(() => null) };
  expect(shouldShowWelcome(storage)).toBe(true);
  expect(storage.getItem).toHaveBeenCalledWith("retroforge.onboarding.v1");
});
it("handles corrupt values and unavailable browser storage without repeated session prompts", async () => {
  const { shouldShowWelcome, dismissWelcome } = await import("./onboarding");
  const storage = {
    getItem: () => {
      throw Error("disabled");
    },
    setItem: () => {
      throw Error("disabled");
    },
  };
  expect(shouldShowWelcome(storage)).toBe(true);
  dismissWelcome(storage);
  expect(shouldShowWelcome(storage)).toBe(false);
});
it("recognizes persisted dismissal", async () => {
  const { shouldShowWelcome } = await import("./onboarding");
  expect(shouldShowWelcome({ getItem: () => "dismissed" })).toBe(false);
});
