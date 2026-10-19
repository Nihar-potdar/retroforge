import { describe, expect, it } from "vitest";
import { cpus } from "@/data/cpu";
import { gpus } from "@/data/gpu";
import { motherboards } from "@/data/motherboard";
import { ramKits } from "@/data/ram";
import { psus } from "@/data/psu";
import { storageDevices } from "@/data/storage";
import type { BUILD, PSU } from "@/data/type";
import { assessBuild } from "./BuildAssessment";
import { estimatePowerUsage, normalizePowerMetadata } from "./Power";

describe("power estimates", () => {
  it("returns a breakdown without requiring a PSU", () => {
    const power = estimatePowerUsage({
      CPU: { ...cpus[8], maxPowerW: 253 },
      GPU: { ...gpus[4], boardPowerW: 450, recommendedPsuW: 850 },
      MOTHERBOARD: motherboards[0],
      RAM: ramKits[0],
      STORAGE: [
        { instanceId: "ssd-1", product: storageDevices[0] },
        { instanceId: "ssd-2", product: storageDevices[0] },
        { instanceId: "hdd", product: storageDevices[14] },
      ],
    });
    expect(power).toMatchObject({
      cpuW: 253,
      gpuW: 450,
      motherboardW: 50,
      ramW: 20,
      storageW: 45,
      accessoriesW: 30,
      estimatedLoadW: 848,
      recommendedPsuW: 1060,
      vendorPsuW: 850,
      isPartial: false,
      uncertainParts: [],
    });
  });

  it("uses turbo/package limits instead of treating CPU TDP as maximum consumption", () => {
    expect(estimatePowerUsage({ CPU: cpus[8], STORAGE: [] }).cpuW).toBe(253);
    expect(cpus[8].tdp).toBe(125);
  });

  it("rounds fractional recommendations upwards", () => {
    expect(
      estimatePowerUsage({ CPU: { ...cpus[0], maxPowerW: 101 }, STORAGE: [] })
        .recommendedPsuW,
    ).toBe(164);
  });

  it("uses the vendor floor when it exceeds the margin", () => {
    expect(estimatePowerUsage({ GPU: gpus[4], STORAGE: [] })).toMatchObject({
      estimatedLoadW: 450,
      recommendedPsuW: 850,
    });
  });

  it("uses only the margin where the vendor publishes no PSU floor", () => {
    expect(estimatePowerUsage({ GPU: gpus[8], STORAGE: [] })).toMatchObject({
      estimatedLoadW: 260,
      recommendedPsuW: 325,
      vendorPsuW: 0,
      uncertainParts: [],
    });
  });

  it("does not add the cooling allowance to an empty or GPU-only build", () => {
    expect(estimatePowerUsage({ STORAGE: [] })).toMatchObject({
      estimatedLoadW: 0,
      recommendedPsuW: 0,
      accessoriesW: 0,
      isPartial: true,
    });
    expect(estimatePowerUsage({ GPU: gpus[0], STORAGE: [] }).accessoriesW).toBe(
      0,
    );
    expect(
      estimatePowerUsage({ MOTHERBOARD: motherboards[0], STORAGE: [] }),
    ).toMatchObject({ accessoriesW: 30, estimatedLoadW: 80 });
  });

  it("supports a complete integrated-graphics build without a discrete GPU", () => {
    const build: BUILD = {
      CPU: cpus[2],
      MOTHERBOARD: motherboards[2],
      RAM: ramKits[5],
      STORAGE: [{ instanceId: "one", product: storageDevices[0] }],
    };
    expect(estimatePowerUsage(build).isPartial).toBe(false);
    expect(
      estimatePowerUsage({ ...build, CPU: cpus[0] }).missingComponents,
    ).toEqual(["GPU"]);
    expect(estimatePowerUsage({ STORAGE: [] }).missingComponents).toEqual([
      "CPU",
      "motherboard",
      "RAM",
      "storage",
      "GPU",
    ]);
  });

  it("restores missing catalogue metadata without changing saved specifications", () => {
    const build: BUILD = {
      CPU: {
        ...cpus[8],
        maxPowerW: undefined,
        price: 1,
        socket: "saved-socket",
      },
      GPU: {
        ...gpus[4],
        boardPowerW: undefined,
        recommendedPsuW: undefined,
        length: 1,
      },
      STORAGE: [],
    };
    const original = structuredClone(build);
    const restored = normalizePowerMetadata(build);
    expect(restored.CPU).toMatchObject({
      maxPowerW: 253,
      price: 1,
      socket: "saved-socket",
    });
    expect(restored.GPU).toMatchObject({
      boardPowerW: 450,
      recommendedPsuW: 850,
      length: 1,
    });
    expect(build).toEqual(original);
    expect(estimatePowerUsage(build).uncertainParts).toEqual([]);
  });

  it("respects explicit power overrides", () => {
    const build: BUILD = {
      CPU: { ...cpus[8], maxPowerW: 100 },
      GPU: { ...gpus[4], boardPowerW: 200, recommendedPsuW: 400 },
      STORAGE: [],
    };
    expect(estimatePowerUsage(build)).toMatchObject({
      cpuW: 100,
      gpuW: 200,
      vendorPsuW: 400,
    });
    expect(normalizePowerMetadata({ STORAGE: [] })).toMatchObject({
      CPU: undefined,
      GPU: undefined,
    });
  });

  it.each(["name", "id"] as const)(
    "never restores catalogue metadata when %s differs",
    (identity) => {
      const build: BUILD = {
        CPU: {
          ...cpus[0],
          maxPowerW: undefined,
          ...(identity === "name" ? { name: "Unknown CPU" } : { id: 999 }),
        },
        GPU: {
          ...gpus[0],
          boardPowerW: undefined,
          recommendedPsuW: undefined,
          ...(identity === "name" ? { name: "Unknown GPU" } : { id: 999 }),
        },
        STORAGE: [],
      };
      const { power, issues } = assessBuild(build);
      expect(power).toMatchObject({ cpuW: 65, gpuW: 170, vendorPsuW: 0 });
      expect(power.uncertainParts.map((part) => part.componentType)).toEqual([
        "CPU",
        "GPU",
      ]);
      expect(issues).toEqual([
        expect.objectContaining({
          type: "warning",
          rule: "POWER_DATA_INCOMPLETE",
          suggestedAction: "CPU",
        }),
      ]);
    },
  );

  it("warns when only a GPU's vendor recommendation is missing", () => {
    const build: BUILD = {
      GPU: { ...gpus[0], id: 999, recommendedPsuW: undefined },
      STORAGE: [],
    };
    expect(assessBuild(build).issues[0]).toMatchObject({
      rule: "POWER_DATA_INCOMPLETE",
      suggestedAction: "GPU",
    });
  });
});

describe("PSU sizing policy", () => {
  // CPU 100W + cooling/accessories 30W = 130W load, ceil(162.5W) = 163W recommendation.
  it.each([
    [129, "error", "PSU_WATTAGE"],
    [130, "warning", "PSU_HEADROOM"],
    [162, "warning", "PSU_HEADROOM"],
    [163, undefined, undefined],
    [164, undefined, undefined],
  ])("%sW PSU → %s / %s", (wattage, type, rule) => {
    const issues = assessBuild({
      CPU: { ...cpus[0], maxPowerW: 100 },
      PSU: { ...psus[0], wattage },
      STORAGE: [],
    }).issues;
    if (!rule) expect(issues).toEqual([]);
    else {
      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({ type, rule, suggestedAction: "PSU" });
      expect(issues[0].source).toBeUndefined();
      expect(issues[0].target).toBeUndefined();
      expect(issues[0].compatibilityIssue).toContain("130W");
      expect(issues[0].compatibilityIssue).toContain("163W");
    }
  });

  it.each([
    "80+ Bronze",
    "80+ Gold",
    "80+ Platinum",
    "80+ Titanium",
  ] as PSU["efficiencyRating"][])(
    "does not derate PSU output by %s efficiency",
    (efficiencyRating) => {
      expect(
        assessBuild({
          CPU: { ...cpus[0], maxPowerW: 100 },
          PSU: { ...psus[0], wattage: 163, efficiencyRating },
          STORAGE: [],
        }).issues,
      ).toEqual([]);
    },
  );

  it("retains data warnings alongside capacity errors", () => {
    const issues = assessBuild({
      CPU: { ...cpus[0], name: "Custom CPU", maxPowerW: undefined },
      PSU: { ...psus[0], wattage: 1 },
      STORAGE: [],
    }).issues;
    expect(issues.map((issue) => issue.rule)).toEqual([
      "POWER_DATA_INCOMPLETE",
      "PSU_WATTAGE",
    ]);
  });

  it("returns no PSU sizing issue until a PSU is selected", () => {
    expect(
      assessBuild({ CPU: cpus[8], GPU: gpus[4], STORAGE: [] }).issues,
    ).toEqual([]);
    expect(assessBuild({ PSU: psus[0], STORAGE: [] }).issues).toEqual([]);
  });
});
