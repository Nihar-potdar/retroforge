import { describe, expect, it } from "vitest";
import { cpus } from "@/data/cpu";
import { cases } from "@/data/case";
import { componentGroups } from "@/Pages/build/buildCatalog";
import { assemblyProfile, installedModels, resolveModel } from "./registry";
import { guides } from "@/data/guides";
import assets from "./assets.json";
import { existsSync } from "node:fs";
it("maps every supported product and never claims generic models are exact", () => {
  for (const group of componentGroups.filter((group) => group.id !== "storage"))
    for (const product of group.items) {
      const model = resolveModel(product);
      expect(model).not.toBeNull();
      expect(model!.productId).toBe(product.id);
      expect(model!.fidelity).toBe(
        product.name === "Corsair 4000D Airflow" ? "exact" : "illustrative",
      );
      expect(model!.source).toMatch(/^https:\/\//);
      expect(existsSync(`public/${model!.url.replace(/^\//, "")}`)).toBe(true);
    }
});
it("an empty or partial build never invents installed components", () => {
  expect(installedModels({ STORAGE: [] })).toEqual([]);
  expect(
    installedModels({ CPU: cpus[0], STORAGE: [] }).map((model) => model.kind),
  ).toEqual(["cpu"]);
  expect(assemblyProfile({ CASE: cases[0], STORAGE: [] }).schematic).toBe(true);
});
it("independent CPU and RAM assets are distinct and the asset budget stays below 25% of baseline", () => {
  expect(assets.cpu.url).not.toBe(assets.ram.url);
  expect(assets.cpu.url).not.toBe(assets.motherboard.url);
  expect(
    Object.values(assets).reduce((n, asset) => n + asset.bytes, 0),
  ).toBeLessThan(18073612 * 0.25);
});
describe("guide curriculum", () => {
  it("preserves existing links and covers the agreed beginner and advanced path", () => {
    expect(guides).toHaveLength(14);
    expect(new Set(guides.map((guide) => guide.slug)).size).toBe(14);
    for (const slug of [
      "compatibility-first",
      "power-without-guessing",
      "airflow-that-makes-sense",
      "storage-without-confusion",
      "first-build-sequence",
      "performance-tuning",
      "custom-liquid-cooling",
    ])
      expect(guides.find((guide) => guide.slug === slug)).toBeDefined();
  });
  it("contains usable next actions, valid related articles, and substantive content", () => {
    for (const guide of guides) {
      expect(guide.sections.length).toBeGreaterThanOrEqual(6);
      expect(
        guide.sections.reduce((n, s) => n + s.body.split(/\s+/).length, 0),
      ).toBeGreaterThan(300);
      expect(guide.actions.length).toBeGreaterThan(0);
      expect(guide.readingMinutes).toBeGreaterThan(0);
      for (const slug of guide.related)
        expect(guides.some((item) => item.slug === slug)).toBe(true);
    }
  });
});
