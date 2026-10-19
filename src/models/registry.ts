import assets from "./assets.json";
import { componentGroups } from "@/Pages/build/buildCatalog";
import type { BUILD, CompatibleComponent } from "@/data/type";
export type ModelKind = "cpu" | "gpu" | "motherboard" | "ram" | "psu" | "case";
export type ModelEntry = {
  kind: ModelKind;
  productId: number;
  fidelity: "exact" | "illustrative";
  url: string;
  bytes: number;
  source: string;
  author: string;
  license: string;
  dimensionsVerified: boolean;
};
const kinds: Record<string, ModelKind> = {
  CPU: "cpu",
  GPU: "gpu",
  Motherboard: "motherboard",
  RAM: "ram",
  PSU: "psu",
  Case: "case",
};
function createModel(part: CompatibleComponent): ModelEntry | null {
  const kind = kinds[part.componentType];
  if (!kind) return null;
  const asset = assets[kind];
  // Only the matching Corsair product has an identified product-specific asset.
  // Dimensions and physical clearances remain outside this visualization's claims.
  const exact =
    kind === "case" && part.id === 3 && part.name === "Corsair 4000D Airflow";
  return {
    kind,
    productId: part.id,
    fidelity: exact ? "exact" : "illustrative",
    url: import.meta.env.BASE_URL + asset.url,
    bytes: asset.bytes,
    ...asset.credits,
    dimensionsVerified: false,
  };
}
export const productModelRegistry: Record<string, ModelEntry> =
  Object.fromEntries(
    componentGroups.flatMap((group) =>
      group.items.flatMap((part) => {
        const model = createModel(part);
        return model ? [[`${part.componentType}:${part.id}`, model]] : [];
      }),
    ),
  );
export function resolveModel(part: CompatibleComponent): ModelEntry | null {
  const model = productModelRegistry[`${part.componentType}:${part.id}`];
  // Saved/custom data with a mismatched product name cannot inherit exact fidelity.
  if (model?.fidelity === "exact" && part.name !== "Corsair 4000D Airflow")
    return createModel(part);
  return model ?? createModel(part);
}
export function installedModels(build: BUILD) {
  return (
    [
      build.CASE,
      build.MOTHERBOARD,
      build.CPU,
      build.RAM,
      build.GPU,
      build.PSU,
    ] as (CompatibleComponent | undefined)[]
  )
    .filter((part): part is CompatibleComponent => Boolean(part))
    .map(resolveModel)
    .filter((model): model is ModelEntry => Boolean(model));
}
export const assemblyProfiles = {
  "corsair-4000d": {
    label:
      "Corsair 4000D calibrated schematic arrangement — clearances are not simulated",
    schematic: true,
  },
  schematic: {
    label:
      "Calibrated illustrative arrangement — physical fit is not simulated",
    schematic: true,
  },
};
export function assemblyProfile(build: BUILD) {
  return build.CASE && resolveModel(build.CASE)?.fidelity === "exact"
    ? assemblyProfiles["corsair-4000d"]
    : assemblyProfiles.schematic;
}
