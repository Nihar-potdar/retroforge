import { describe, expect, it } from "vitest";
import { cpus } from "@/data/cpu";
import { gpus } from "@/data/gpu";
import { psus } from "@/data/psu";
import { cases } from "@/data/case";
import { ramKits } from "@/data/ram";
import { motherboards } from "@/data/motherboard";
import { storageDevices } from "@/data/storage";
import type { BUILD, CompatibleComponent } from "@/data/type";
import { assessBuild } from "./BuildAssessment";
import {
  buildWithCandidate,
  componentKey,
  getCandidateCompatibilityIssues,
  isCandidateCompatible,
} from "./CandidateCompatibility";
import { hasCompatibilityErrors } from "./Issue";

describe("candidate previews", () => {
  it.each([
    ["CPU", cpus[1]],
    ["GPU", gpus[1]],
    ["RAM", ramKits[1]],
    ["PSU", psus[1]],
    ["MOTHERBOARD", motherboards[1]],
    ["CASE", cases[1]],
  ] as const)(
    "replaces %s without mutating the current build",
    (slot, candidate) => {
      const build: BUILD = {
        CPU: cpus[0],
        GPU: gpus[0],
        RAM: ramKits[0],
        PSU: psus[0],
        MOTHERBOARD: motherboards[0],
        CASE: cases[0],
        STORAGE: [],
      };
      const original = structuredClone(build);
      const preview = buildWithCandidate(build, candidate);
      expect(preview[slot]).toEqual(candidate);
      expect(build).toEqual(original);
      expect(preview.STORAGE).toBe(build.STORAGE);
    },
  );

  it("appends repeated storage as a distinct instance without mutating the build", () => {
    const build: BUILD = {
      STORAGE: [{ instanceId: "original", product: storageDevices[0] }],
    };
    const preview = buildWithCandidate(build, storageDevices[0]);
    expect(preview.STORAGE).toHaveLength(2);
    expect(preview.STORAGE[1].instanceId).not.toBe("original");
    expect(build.STORAGE).toHaveLength(1);
    expect(preview.STORAGE[0]).toBe(build.STORAGE[0]);
  });

  it("ignores unrelated existing errors and matching numeric IDs from other categories", () => {
    const build: BUILD = {
      CPU: cpus[0],
      MOTHERBOARD: motherboards[2],
      STORAGE: [],
    };
    expect(assessBuild(build).issues).toHaveLength(1);
    expect(gpus[0].id).toBe(cpus[0].id);
    expect(getCandidateCompatibilityIssues(build, gpus[0])).toEqual([]);
    expect(isCandidateCompatible(build, gpus[0])).toBe(true);
    expect(componentKey(gpus[0])).not.toBe(componentKey(cpus[0]));
  });

  it("motherboard candidates check CPU, RAM, case, storage protocol and capacity", () => {
    const build: BUILD = {
      CPU: cpus[0],
      RAM: ramKits[0],
      CASE: { ...cases[0], formFactor: "Mini ITX" },
      STORAGE: ["one", "two"].map((instanceId) => ({
        instanceId,
        product: storageDevices[8],
      })),
    };
    const issues = getCandidateCompatibilityIssues(build, {
      ...motherboards[2],
      m2Slots: 1,
    });
    expect(issues.map((entry) => entry.rule)).toEqual([
      "CPU_MOTHERBOARD_SOCKET",
      "RAM_MOTHERBOARD_TYPE",
      "MOTHERBOARD_CASE_FORM_FACTOR",
      "STORAGE_PROTOCOL",
      "STORAGE_PROTOCOL",
      "STORAGE_CAPACITY",
    ]);
  });

  it("storage candidates only attribute per-drive issues to the preview instance", () => {
    const build: BUILD = {
      MOTHERBOARD: motherboards[2],
      STORAGE: [{ instanceId: "existing", product: storageDevices[8] }],
    };
    const issues = getCandidateCompatibilityIssues(build, storageDevices[8]);
    expect(issues).toHaveLength(1);
    expect(issues[0].source?.instanceId).not.toBe("existing");
  });

  it("storage candidates cannot exceed available connections", () => {
    const build: BUILD = {
      MOTHERBOARD: { ...motherboards[0], m2Slots: 1 },
      STORAGE: [{ instanceId: "one", product: storageDevices[0] }],
    };
    expect(isCandidateCompatible(build, storageDevices[0])).toBe(false);
    expect(
      getCandidateCompatibilityIssues(build, storageDevices[0]).map(
        (entry) => entry.rule,
      ),
    ).toEqual(["STORAGE_CAPACITY"]);
  });

  it("returns headroom advice without excluding a PSU", () => {
    const build: BUILD = { CPU: { ...cpus[0], maxPowerW: 100 }, STORAGE: [] };
    const candidate = { ...psus[0], wattage: 130 };
    expect(getCandidateCompatibilityIssues(build, candidate)[0]).toMatchObject({
      type: "warning",
      rule: "PSU_HEADROOM",
    });
    expect(isCandidateCompatible(build, candidate)).toBe(true);
    expect(isCandidateCompatible(build, { ...candidate, wattage: 129 })).toBe(
      false,
    );
    expect(isCandidateCompatible(build, { ...candidate, wattage: 163 })).toBe(
      true,
    );
  });

  it("reports capacity shortfalls for parts that raise load", () => {
    const build: BUILD = {
      CPU: { ...cpus[0], maxPowerW: 100 },
      PSU: { ...psus[0], wattage: 163 },
      STORAGE: [],
    };
    expect(isCandidateCompatible(build, { ...cpus[0], maxPowerW: 200 })).toBe(
      false,
    );
    expect(
      getCandidateCompatibilityIssues(build, gpus[4]).some(
        (entry) => entry.rule === "PSU_WATTAGE",
      ),
    ).toBe(true);
    expect(
      getCandidateCompatibilityIssues(
        { ...build, PSU: { ...psus[0], wattage: 130 } },
        storageDevices[0],
      ).some((entry) => entry.rule === "PSU_WATTAGE"),
    ).toBe(true);
  });

  it("does not exclude a lower-power replacement merely because a PSU error remains", () => {
    const build: BUILD = {
      CPU: { ...cpus[0], maxPowerW: 200 },
      PSU: { ...psus[0], wattage: 1 },
      STORAGE: [],
    };
    const candidate = { ...cpus[0], maxPowerW: 100 };
    expect(
      assessBuild(buildWithCandidate(build, candidate)).issues[0].rule,
    ).toBe("PSU_WATTAGE");
    expect(getCandidateCompatibilityIssues(build, candidate)).toEqual([]);
    expect(isCandidateCompatible(build, candidate)).toBe(true);
    expect(getCandidateCompatibilityIssues(build, cases[0])).toEqual([]);
  });

  it("reports newly increased recommendations and ignores unchanged advice", () => {
    const build: BUILD = {
      CPU: { ...cpus[0], maxPowerW: 100 },
      PSU: { ...psus[0], wattage: 300 },
      STORAGE: [],
    };
    const candidate = { ...gpus[0], boardPowerW: 100, recommendedPsuW: 550 };
    expect(
      getCandidateCompatibilityIssues(build, candidate).map(
        (entry) => entry.rule,
      ),
    ).toEqual(["PSU_HEADROOM"]);
    expect(
      getCandidateCompatibilityIssues(
        buildWithCandidate(build, candidate),
        ramKits[0],
      ),
    ).toEqual([]);
  });

  it("unknown CPU/GPU metadata produces visible candidate warnings", () => {
    const candidate = { ...cpus[0], id: 999, maxPowerW: undefined };
    expect(
      getCandidateCompatibilityIssues({ STORAGE: [] }, candidate)[0].rule,
    ).toBe("POWER_DATA_INCOMPLETE");
    expect(isCandidateCompatible({ STORAGE: [] }, candidate)).toBe(true);
  });

  it("PSU candidates expose uncertainty in the system estimate", () => {
    const build: BUILD = {
      CPU: { ...cpus[0], id: 999, maxPowerW: undefined },
      STORAGE: [],
    };
    expect(getCandidateCompatibilityIssues(build, psus[0])[0].rule).toBe(
      "POWER_DATA_INCOMPLETE",
    );
    expect(isCandidateCompatible(build, psus[0])).toBe(true);
  });

  it.each([
    cpus[2],
    ramKits[5],
    gpus[4],
    psus[0],
    motherboards[2],
    cases[0],
    storageDevices[8],
  ] as CompatibleComponent[])(
    "candidate results are drawn from the same proposed-build assessment: %s",
    (candidate) => {
      const build: BUILD = {
        CPU: cpus[0],
        MOTHERBOARD: motherboards[0],
        RAM: ramKits[0],
        PSU: psus[0],
        CASE: { ...cases[0], maxGpuLength: 1 },
        STORAGE: [],
      };
      const fullIssues = assessBuild(
        buildWithCandidate(build, candidate),
      ).issues;
      const candidateIssues = getCandidateCompatibilityIssues(build, candidate);
      for (const entry of candidateIssues)
        expect(fullIssues).toContainEqual(entry);
      expect(isCandidateCompatible(build, candidate)).toBe(
        !hasCompatibilityErrors(candidateIssues),
      );
    },
  );

  it("replacing or removing a conflicting part resolves its issues", () => {
    const build: BUILD = {
      CPU: cpus[0],
      MOTHERBOARD: motherboards[2],
      STORAGE: [],
    };
    expect(isCandidateCompatible(build, cpus[2])).toBe(true);
    expect(assessBuild(buildWithCandidate(build, cpus[2])).issues).toEqual([]);
    expect(assessBuild({ ...build, MOTHERBOARD: undefined }).issues).toEqual(
      [],
    );
  });
});
