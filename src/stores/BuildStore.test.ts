import { beforeEach, expect, it } from "vitest";
import { createFreshBuild, DEFAULT_CASE, useBuildStore } from "./BuildStore";
import { cpus } from "@/data/cpu";
beforeEach(() =>
  useBuildStore.setState({
    build: createFreshBuild(),
    intent: "initial",
    revision: 0,
    defaultCaseNotice: true,
  }),
);
it("fresh builds select the named default as a real priced case and do not share mutable collections", () => {
  const first = createFreshBuild(),
    second = createFreshBuild();
  expect(first.CASE?.name).toBe("Corsair 4000D Airflow");
  expect(first.CASE?.price).toBe(DEFAULT_CASE.price);
  expect(first.CASE).not.toBe(second.CASE);
  expect(first.STORAGE).not.toBe(second.STORAGE);
});
it("removing the case does not reinstall it on subsequent edits", () => {
  useBuildStore.getState().setPart("CASE", undefined);
  useBuildStore.getState().setPart("CPU", cpus[0]);
  expect(useBuildStore.getState().build.CASE).toBeUndefined();
  expect(useBuildStore.getState().defaultCaseNotice).toBe(false);
});
it("loads saved/prebuilt contents exactly and marks the change non-animated", () => {
  const saved = { CPU: cpus[0], STORAGE: [] };
  useBuildStore.getState().setBuild(saved, "load");
  expect(useBuildStore.getState().build).toBe(saved);
  expect(useBuildStore.getState().intent).toBe("load");
  expect(useBuildStore.getState().defaultCaseNotice).toBe(false);
});
it("reset restores the default and renews a dismissed notice", () => {
  useBuildStore.getState().dismissDefaultCaseNotice();
  useBuildStore.getState().setBuild(createFreshBuild(), "reset");
  expect(useBuildStore.getState().defaultCaseNotice).toBe(true);
  expect(useBuildStore.getState().intent).toBe("reset");
  expect(useBuildStore.getState().revision).toBe(1);
  expect(useBuildStore.getState().build.CASE?.id).toBe(3);
});
it("ordinary edits preserve notice dismissal", () => {
  useBuildStore.getState().dismissDefaultCaseNotice();
  useBuildStore.getState().setBuild((build) => ({ ...build, CPU: cpus[0] }));
  expect(useBuildStore.getState().defaultCaseNotice).toBe(false);
  expect(useBuildStore.getState().intent).toBe("edit");
});
