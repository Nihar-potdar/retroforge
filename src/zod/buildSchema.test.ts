import { describe, expect, it } from "vitest";
import { cpus } from "@/data/cpu";
import { gpus } from "@/data/gpu";
import { psus } from "@/data/psu";
import { motherboards } from "@/data/motherboard";
import { ramKits } from "@/data/ram";
import { cases } from "@/data/case";
import { storageDevices } from "@/data/storage";
import { prebuilts } from "@/data/PreBuilds";
import { assessBuild } from "@/Logic/Compatibility/BuildAssessment";
import { normalizePowerMetadata } from "@/Logic/Compatibility/Power";
import {
  buildSchema,
  cpuSchema,
  gpuSchema,
  savedBuildListSchema,
} from "./buildSchema";

describe("catalogue and saved-build validation", () => {
  it("every current CPU/GPU has explicit sizing metadata", () => {
    for (const cpu of cpus) expect(cpu.maxPowerW).toBeGreaterThan(0);
    for (const gpu of gpus) {
      expect(gpu.boardPowerW).toBeGreaterThan(0);
      expect(gpu.recommendedPsuW).toBeGreaterThanOrEqual(0);
    }
  });

  it("all catalogue products and prebuilts satisfy the saved-build schema", () => {
    for (const CPU of cpus)
      expect(buildSchema.safeParse({ CPU, STORAGE: [] }).success).toBe(true);
    for (const GPU of gpus)
      expect(buildSchema.safeParse({ GPU, STORAGE: [] }).success).toBe(true);
    for (const PSU of psus)
      expect(buildSchema.safeParse({ PSU, STORAGE: [] }).success).toBe(true);
    for (const MOTHERBOARD of motherboards)
      expect(buildSchema.safeParse({ MOTHERBOARD, STORAGE: [] }).success).toBe(
        true,
      );
    for (const RAM of ramKits)
      expect(buildSchema.safeParse({ RAM, STORAGE: [] }).success).toBe(true);
    for (const CASE of cases)
      expect(buildSchema.safeParse({ CASE, STORAGE: [] }).success).toBe(true);
    for (const product of storageDevices)
      expect(
        buildSchema.safeParse({ STORAGE: [{ instanceId: "one", product }] })
          .success,
      ).toBe(true);
    expect(
      savedBuildListSchema.safeParse(
        prebuilts.map(({ id, name, build }) => ({ id, name, build })),
      ).success,
    ).toBe(true);
  });

  it("loads old JSON and recovers power metadata while preserving repeated drive instances", () => {
    const saved = [
      {
        id: "old",
        name: "Old build",
        build: {
          CPU: { ...cpus[8], maxPowerW: undefined },
          GPU: {
            ...gpus[4],
            boardPowerW: undefined,
            recommendedPsuW: undefined,
          },
          STORAGE: ["one", "two"].map((instanceId) => ({
            instanceId,
            product: storageDevices[0],
          })),
        },
      },
    ];
    const parsed = savedBuildListSchema.parse(
      JSON.parse(JSON.stringify(saved)),
    );
    const restored = normalizePowerMetadata(parsed[0].build);
    expect(restored.CPU?.maxPowerW).toBe(253);
    expect(restored.GPU?.boardPowerW).toBe(450);
    expect(restored.GPU?.recommendedPsuW).toBe(850);
    expect(restored.STORAGE.map((drive) => drive.instanceId)).toEqual([
      "one",
      "two",
    ]);
    expect(assessBuild(restored).power.storageW).toBe(20);
  });

  it.each([0, -1, NaN, Infinity, "253"])(
    "rejects invalid power metadata %s",
    (value) => {
      expect(
        cpuSchema.safeParse({ ...cpus[0], maxPowerW: value }).success,
      ).toBe(false);
      expect(
        gpuSchema.safeParse({ ...gpus[0], boardPowerW: value }).success,
      ).toBe(false);
    },
  );

  it.each([-1, NaN, Infinity, "550"])(
    "rejects invalid PSU recommendations %s",
    (value) => {
      expect(
        gpuSchema.safeParse({ ...gpus[0], recommendedPsuW: value }).success,
      ).toBe(false);
    },
  );

  it("preserves zero as a verified absence of a published GPU vendor floor", () => {
    expect(gpuSchema.parse(gpus[8]).recommendedPsuW).toBe(0);
  });

  it("rejects malformed saves and installed drives", () => {
    for (const value of [
      null,
      {},
      [{ id: "", name: "Build", build: { STORAGE: [] } }],
      [{ id: "x", name: "Build", build: {} }],
    ]) {
      expect(savedBuildListSchema.safeParse(value).success).toBe(false);
    }
    expect(
      buildSchema.safeParse({
        STORAGE: [{ instanceId: "", product: storageDevices[0] }],
      }).success,
    ).toBe(false);
    expect(
      buildSchema.safeParse({
        STORAGE: [
          {
            instanceId: "one",
            product: { ...storageDevices[0], connector: "PCIe" },
          },
        ],
      }).success,
    ).toBe(false);
  });
});
