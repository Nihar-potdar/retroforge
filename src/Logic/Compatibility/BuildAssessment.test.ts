import { describe, expect, it } from "vitest";
import { cpus } from "@/data/cpu";
import { gpus } from "@/data/gpu";
import { cases } from "@/data/case";
import { motherboards } from "@/data/motherboard";
import { ramKits } from "@/data/ram";
import { storageDevices } from "@/data/storage";
import { prebuilts } from "@/data/PreBuilds";
import type { BUILD } from "@/data/type";
import { assessBuild } from "./BuildAssessment";
import { hasCompatibilityErrors } from "./Issue";

describe("full-build assessment", () => {
  it("accepts missing counterparts without claiming a complete power estimate", () => {
    for (const build of [
      { STORAGE: [] },
      { CPU: cpus[0], STORAGE: [] },
      { RAM: ramKits[0], STORAGE: [] },
      { GPU: gpus[0], STORAGE: [] },
      { CASE: cases[0], STORAGE: [] },
    ]) {
      expect(assessBuild(build).issues).toEqual([]);
      expect(assessBuild(build).power.isPartial).toBe(true);
    }
  });

  it("reports multiple independent issues exactly once", () => {
    const build: BUILD = {
      CPU: cpus[0],
      RAM: ramKits[0],
      MOTHERBOARD: motherboards[2],
      GPU: gpus[4],
      CASE: { ...cases[0], maxGpuLength: 1, formFactor: "Mini ITX" },
      STORAGE: [],
    };
    expect(assessBuild(build).issues.map((issue) => issue.rule)).toEqual([
      "CPU_MOTHERBOARD_SOCKET",
      "RAM_MOTHERBOARD_TYPE",
      "GPU_CASE_CLEARANCE",
      "MOTHERBOARD_CASE_FORM_FACTOR",
    ]);
    const issues = assessBuild(build).issues;
    expect(new Set(issues.map((issue) => issue.key)).size).toBe(4);
    expect(assessBuild(structuredClone(build)).issues).toEqual(issues);
  });

  it.each(["M.2", "SATA"] as const)(
    "checks aggregate %s capacity at and beyond equality",
    (connector) => {
      const product =
        connector === "M.2" ? storageDevices[0] : storageDevices[10];
      const build: BUILD = {
        MOTHERBOARD: { ...motherboards[0], m2Slots: 2, sataPorts: 2 },
        STORAGE: ["one", "two"].map((instanceId) => ({ instanceId, product })),
      };
      expect(assessBuild(build).issues).toEqual([]);
      const exceeded = {
        ...build,
        STORAGE: [...build.STORAGE, { instanceId: "three", product }],
      };
      const issues = assessBuild(exceeded).issues;
      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({
        rule: "STORAGE_CAPACITY",
        type: "error",
        suggestedAction: "STORAGE",
      });
      expect(
        issues[0].affectedParts
          .filter((part) => part.componentType === "Storage")
          .map((part) => part.instanceId),
      ).toEqual(["one", "two", "three"]);
      expect(assessBuild(build).issues).toEqual([]);
    },
  );

  it("separates M.2 and SATA pools and reports both overflows", () => {
    const issues = assessBuild({
      MOTHERBOARD: { ...motherboards[0], m2Slots: 1, sataPorts: 1 },
      STORAGE: [
        storageDevices[0],
        storageDevices[0],
        storageDevices[10],
        storageDevices[10],
      ].map((product, index) => ({ instanceId: String(index), product })),
    }).issues;
    expect(issues).toHaveLength(2);
    expect(new Set(issues.map((issue) => issue.key)).size).toBe(2);
  });

  it("zero connector counts report per-instance issues without redundant overflow issues", () => {
    const issues = assessBuild({
      MOTHERBOARD: { ...motherboards[0], m2Slots: 0 },
      STORAGE: ["one", "two"].map((instanceId) => ({
        instanceId,
        product: storageDevices[0],
      })),
    }).issues;
    expect(issues.map((issue) => issue.rule)).toEqual([
      "STORAGE_CONNECTOR",
      "STORAGE_CONNECTOR",
    ]);
    expect(new Set(issues.map((issue) => issue.key)).size).toBe(2);
  });

  it("uses installed identity in repeated protocol conflicts", () => {
    const issues = assessBuild({
      MOTHERBOARD: motherboards[2],
      STORAGE: ["one", "two"].map((instanceId) => ({
        instanceId,
        product: storageDevices[8],
      })),
    }).issues;
    expect(issues.map((issue) => issue.rule)).toEqual([
      "STORAGE_PROTOCOL",
      "STORAGE_PROTOCOL",
    ]);
    expect(issues[0].key).not.toBe(issues[1].key);
  });

  it.each(prebuilts)(
    "catalogue prebuilt $name has no compatibility errors",
    ({ build }) => {
      expect(hasCompatibilityErrors(assessBuild(build).issues)).toBe(false);
      expect(assessBuild(build).power.isPartial).toBe(false);
    },
  );
});
