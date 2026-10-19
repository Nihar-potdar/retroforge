import { describe, expect, it } from "vitest";
import { cpus } from "@/data/cpu";
import { ramKits } from "@/data/ram";
import { gpus } from "@/data/gpu";
import { cases } from "@/data/case";
import { motherboards } from "@/data/motherboard";
import { storageDevices } from "@/data/storage";
import { psus } from "@/data/psu";
import type { CASE, CompatibleComponent, StorageProtocol } from "@/data/type";
import { checkPair } from "./CompatibilityRules";
import {
  buildToComponents,
  compatibilityEngine,
  componentsToBuild,
  getDetailedErrors,
  validateBuild,
} from "./Compatibility";
import { assessBuild } from "./BuildAssessment";

describe("pair rules", () => {
  it.each([
    ["AM4", "AM4", true],
    ["AM5", "AM5", true],
    ["LGA1700", "LGA1851", false],
    ["AM4", "AM5", false],
  ])("socket %s / %s → %s", (socket, motherboardSocket, compatible) => {
    const result = checkPair(
      { ...cpus[0], socket },
      { ...motherboards[0], socket: motherboardSocket },
    );
    expect(result?.isCompatible).toBe(compatible);
    if (result && !result.isCompatible) {
      expect(result.error.rule).toBe("CPU_MOTHERBOARD_SOCKET");
      expect(result.error.source?.value).toBe(socket);
      expect(result.error.target?.value).toBe(motherboardSocket);
    }
  });

  it.each([
    ["DDR4", "DDR4", true],
    ["DDR5", "DDR5", true],
    ["DDR4", "DDR5", false],
    ["DDR5", "DDR4", false],
  ] as const)("RAM %s / %s → %s", (type, ramType, compatible) => {
    expect(
      checkPair({ ...ramKits[0], type }, { ...motherboards[0], ramType })
        ?.isCompatible,
    ).toBe(compatible);
  });

  it.each([
    [299, true],
    [300, true],
    [301, false],
  ])("GPU %s mm / 300 mm → %s", (length, compatible) => {
    const result = checkPair(
      { ...gpus[0], length },
      { ...cases[0], maxGpuLength: 300 },
    );
    expect(result?.isCompatible).toBe(compatible);
    if (result && !result.isCompatible) {
      expect(result.error.source?.value).toBe("301 mm");
      expect(result.error.rule).toBe("GPU_CASE_CLEARANCE");
    }
  });

  const formFactors: CASE["formFactor"][] = ["Mini ITX", "Micro ATX", "ATX"];
  it.each(
    formFactors.flatMap((caseSize, index) =>
      formFactors.map((boardSize, boardIndex) => ({
        caseSize,
        boardSize,
        compatible: boardIndex <= index,
      })),
    ),
  )(
    "case $caseSize / motherboard $boardSize → $compatible",
    ({ caseSize, boardSize, compatible }) => {
      const result = checkPair(
        { ...cases[0], formFactor: caseSize },
        { ...motherboards[0], formFactor: boardSize },
      );
      expect(result?.isCompatible).toBe(compatible);
      if (result && !result.isCompatible)
        expect(result.error.rule).toBe("MOTHERBOARD_CASE_FORM_FACTOR");
    },
  );

  it.each([
    ["M.2", "NVMe", 1, ["NVMe"], true, undefined],
    ["M.2", "SATA", 1, ["SATA"], true, undefined],
    ["M.2", "SATA", 1, ["NVMe"], false, "STORAGE_PROTOCOL"],
    ["M.2", "NVMe", 0, ["NVMe"], false, "STORAGE_CONNECTOR"],
    ["SATA", "SATA", 1, [], true, undefined],
    ["SATA", "SATA", 0, [], false, "STORAGE_CONNECTOR"],
    ["SATA", "NVMe", 1, ["NVMe"], false, "STORAGE_PROTOCOL"],
    ["M.2", "NVMe", 1, [], false, "STORAGE_PROTOCOL"],
  ] as const)(
    "storage %s / %s with %s connectors → %s",
    (connector, protocol, count, protocols, compatible, rule) => {
      const result = checkPair(
        { ...storageDevices[0], connector, protocol },
        {
          ...motherboards[0],
          m2Slots: count,
          sataPorts: count,
          supportedM2Protocols: [...protocols] as StorageProtocol[],
        },
        "drive-1",
      );
      expect(result?.isCompatible).toBe(compatible);
      if (result && !result.isCompatible) {
        expect(result.error.rule).toBe(rule);
        expect(result.error.affectedParts[0].instanceId).toBe("drive-1");
        expect(result.error.suggestedAction).toBe("STORAGE");
      }
    },
  );

  it.each([
    [cpus[0], motherboards[2]],
    [ramKits[0], motherboards[2]],
    [cases[0], motherboards[0]],
    [storageDevices[8], motherboards[2]],
    [gpus[4], { ...cases[0], maxGpuLength: 1 }],
  ] as [CompatibleComponent, CompatibleComponent][])(
    "is symmetric for supported pairs: %s / %s",
    (first, second) => {
      expect(checkPair(first, second)).toEqual(checkPair(second, first));
    },
  );

  it("does not invent rules for unrelated categories", () => {
    expect(checkPair(psus[0], cpus[0])).toBeUndefined();
    expect(checkPair(motherboards[0], psus[0])).toBeUndefined();
    expect(checkPair(cases[0], ramKits[0])).toBeUndefined();
  });
});

describe("catalogue checks and legacy adapters", () => {
  it("checks catalogue targets when no selection is supplied", () => {
    const results = compatibilityEngine(cpus[0]);
    expect(results).toHaveLength(motherboards.length);
    expect(
      results.find((result) => result.targetComponent === motherboards[0].name)
        ?.isCompatible,
    ).toBe(true);
    expect(
      results.find((result) => result.targetComponent === motherboards[2].name)
        ?.isCompatible,
    ).toBe(false);
  });

  it("uses actual targets including parts outside the catalogue", () => {
    const board = {
      ...motherboards[0],
      id: 999,
      socket: "custom",
      name: "Custom motherboard",
    };
    const results = compatibilityEngine(cpus[0], [board, psus[0]]);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      targetComponent: "Custom motherboard",
      isCompatible: false,
    });
    expect(compatibilityEngine(cpus[0], [])).toEqual([]);
    expect(compatibilityEngine(psus[0])).toEqual([]);
  });

  it("covers RAM, GPU, storage, case and motherboard catalogue checks", () => {
    for (const part of [
      ramKits[0],
      gpus[0],
      storageDevices[0],
      cases[0],
      motherboards[0],
    ]) {
      expect(compatibilityEngine(part).length).toBeGreaterThan(0);
    }
  });

  it("preserves every singleton and repeated storage instance when adapting", () => {
    const parts = [
      cpus[0],
      gpus[0],
      ramKits[0],
      psus[0],
      cases[0],
      motherboards[0],
      storageDevices[0],
      storageDevices[0],
    ];
    const build = componentsToBuild(parts);
    expect(buildToComponents(build)).toEqual(parts);
    expect(new Set(build.STORAGE.map((drive) => drive.instanceId)).size).toBe(
      2,
    );
    expect(buildToComponents({ STORAGE: [] })).toEqual([]);
  });

  it("legacy validation uses canonical assessment and separates warnings from errors", () => {
    const parts = [
      { ...cpus[0], maxPowerW: 100 },
      { ...psus[0], wattage: 130 },
    ];
    const issues = assessBuild(componentsToBuild(parts)).issues;
    expect(getDetailedErrors(parts)).toEqual(issues);
    expect(validateBuild(parts)).toEqual([
      expect.objectContaining({
        isCompatible: true,
        error: expect.objectContaining({ rule: "PSU_HEADROOM" }),
      }),
    ]);
    expect(validateBuild([cpus[0], motherboards[2]])).toEqual([
      expect.objectContaining({
        isCompatible: false,
        selectedComponent: cpus[0].name,
        targetComponent: motherboards[2].name,
      }),
    ]);
    expect(validateBuild([])).toEqual([]);
  });
});
