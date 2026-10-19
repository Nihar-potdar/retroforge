import { describe, expect, it } from "vitest";
import { cpus } from "@/data/cpu";
import { gpus } from "@/data/gpu";
import { motherboards } from "@/data/motherboard";
import { psus } from "@/data/psu";
import { storageDevices } from "@/data/storage";
import type { BUILD } from "@/data/type";
import { buildToComponents, getDetailedErrors } from "./Compatibility";
import { assessBuild } from "./BuildAssessment";
import { getCandidateCompatibilityIssues } from "./CandidateCompatibility";

describe("compatibility regressions", () => {
  it("includes insufficient PSU capacity in normal build validation", () => {
    const build: BUILD = {
      CPU: cpus[8],
      GPU: gpus[4],
      PSU: { ...psus[0], wattage: 450 },
      STORAGE: [],
    };
    expect(getDetailedErrors(buildToComponents(build))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: "PSU_WATTAGE" }),
      ]),
    );
  });

  it("reports unsupported storage protocols as actionable issues", () => {
    const build: BUILD = {
      MOTHERBOARD: { ...motherboards[0], supportedM2Protocols: ["NVMe"] },
      STORAGE: [{ instanceId: "drive-1", product: storageDevices[8] }],
    };
    expect(getDetailedErrors(buildToComponents(build))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: "STORAGE_PROTOCOL" }),
      ]),
    );
  });

  it("counts installed instances when checking storage capacity", () => {
    const build: BUILD = {
      MOTHERBOARD: { ...motherboards[0], m2Slots: 1 },
      STORAGE: ["one", "two"].map((instanceId) => ({
        instanceId,
        product: storageDevices[0],
      })),
    };
    expect(getDetailedErrors(buildToComponents(build))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: "STORAGE_CAPACITY" }),
      ]),
    );
  });

  it("increases estimated load for every repeated drive", () => {
    const build: BUILD = {
      PSU: { ...psus[0], wattage: 1 },
      STORAGE: [{ instanceId: "one", product: storageDevices[0] }],
    };
    const one = assessBuild(build).power.estimatedLoadW;
    const two = assessBuild({
      ...build,
      STORAGE: [
        ...build.STORAGE,
        { instanceId: "two", product: storageDevices[0] },
      ],
    }).power.estimatedLoadW;
    expect(one).toBe(10);
    expect(two).toBe(20);
  });

  it("checks actual selected specifications rather than catalogue copies", () => {
    const build: BUILD = {
      CPU: cpus[0],
      MOTHERBOARD: { ...motherboards[0], socket: "different-socket" },
      STORAGE: [],
    };
    expect(getDetailedErrors(buildToComponents(build))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: "CPU_MOTHERBOARD_SOCKET" }),
      ]),
    );
  });

  it("accepts system-level issues without source and target references", () => {
    const build: BUILD = { CPU: cpus[8], GPU: gpus[4], STORAGE: [] };
    const candidate = { ...psus[0], wattage: 1 };
    const issues = getCandidateCompatibilityIssues(build, candidate);
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: "PSU_WATTAGE" }),
      ]),
    );
    expect(
      issues.find((entry) => entry.rule === "PSU_WATTAGE")?.source,
    ).toBeUndefined();
  });
});
