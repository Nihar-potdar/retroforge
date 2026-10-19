import { cpus } from "@/data/cpu";
import { gpus } from "@/data/gpu";
import type { BUILD, DetailedErrors, PowerBreakdown } from "@/data/type";
import { issue, reference } from "./Issue";

/** Only power metadata is recovered; saved/custom specifications are never replaced. */
export function normalizePowerMetadata(build: BUILD): BUILD {
  const cpu = build.CPU;
  const gpu = build.GPU;
  const knownCpu =
    cpu &&
    cpus.find(
      (part) =>
        part.id === cpu.id &&
        part.name === cpu.name &&
        part.componentType === cpu.componentType,
    );
  const knownGpu =
    gpu &&
    gpus.find(
      (part) =>
        part.id === gpu.id &&
        part.name === gpu.name &&
        part.componentType === gpu.componentType,
    );
  return {
    ...build,
    CPU: cpu && { ...cpu, maxPowerW: cpu.maxPowerW ?? knownCpu?.maxPowerW },
    GPU: gpu && {
      ...gpu,
      boardPowerW: gpu.boardPowerW ?? knownGpu?.boardPowerW,
      recommendedPsuW: gpu.recommendedPsuW ?? knownGpu?.recommendedPsuW,
    },
  };
}

export function estimatePowerUsage(input: BUILD): PowerBreakdown {
  const build = normalizePowerMetadata(input);
  const uncertainParts = [];
  if (build.CPU && build.CPU.maxPowerW === undefined) {
    uncertainParts.push(
      reference(build.CPU, "Maximum stock power unavailable; using TDP"),
    );
  }
  if (
    build.GPU &&
    (build.GPU.boardPowerW === undefined ||
      build.GPU.recommendedPsuW === undefined)
  ) {
    uncertainParts.push(
      reference(
        build.GPU,
        "Board power or vendor PSU recommendation unavailable",
      ),
    );
  }
  const cpuW = build.CPU ? (build.CPU.maxPowerW ?? build.CPU.tdp) : 0;
  const gpuW = build.GPU ? (build.GPU.boardPowerW ?? build.GPU.tdp) : 0;
  const motherboardW = build.MOTHERBOARD ? 50 : 0;
  const ramW = build.RAM ? 20 : 0;
  const storageW = build.STORAGE.reduce(
    (total, drive) => total + (drive.product.storageType === "HDD" ? 25 : 10),
    0,
  );
  const accessoriesW = build.CPU || build.MOTHERBOARD ? 30 : 0;
  const estimatedLoadW =
    cpuW + gpuW + motherboardW + ramW + storageW + accessoriesW;
  const vendorPsuW = build.GPU?.recommendedPsuW ?? 0;
  // A discrete GPU is optional only when the selected CPU provides integrated graphics.
  const missingComponents = [
    !build.CPU && "CPU",
    !build.MOTHERBOARD && "motherboard",
    !build.RAM && "RAM",
    build.STORAGE.length === 0 && "storage",
    !build.GPU && !build.CPU?.integratedGraphics && "GPU",
  ].filter((name): name is string => Boolean(name));
  return {
    cpuW,
    gpuW,
    motherboardW,
    ramW,
    storageW,
    accessoriesW,
    estimatedLoadW,
    vendorPsuW,
    recommendedPsuW: Math.ceil(Math.max(estimatedLoadW * 1.25, vendorPsuW)),
    missingComponents,
    uncertainParts,
    isPartial: missingComponents.length > 0,
  };
}

export function powerIssues(
  build: BUILD,
  power: PowerBreakdown,
): DetailedErrors[] {
  const issues: DetailedErrors[] = [];
  if (power.uncertainParts.length > 0) {
    issues.push(
      issue({
        type: "warning",
        rule: "POWER_DATA_INCOMPLETE",
        title: "Power data needs verification",
        compatibilityIssue: `${power.uncertainParts.map((part) => part.name).join(", ")}: verified stock power data or vendor PSU guidance is missing. This estimate is uncertain; verify the manufacturer's specifications.`,
        affectedParts: power.uncertainParts,
        suggestedAction: power.uncertainParts.some(
          (part) => part.componentType === "CPU",
        )
          ? "CPU"
          : "GPU",
      }),
    );
  }
  const psu = build.PSU;
  if (!psu) return issues;
  const affectedParts = [reference(psu, `${psu.wattage}W rated output`)];
  if (psu.wattage < power.estimatedLoadW) {
    issues.push(
      issue({
        type: "error",
        rule: "PSU_WATTAGE",
        title: "PSU capacity is below estimated load",
        compatibilityIssue: `${psu.name} provides ${psu.wattage}W, below the estimated ${power.estimatedLoadW}W load of the selected parts. Choose at least ${power.recommendedPsuW}W for recommended headroom.`,
        affectedParts,
        suggestedAction: "PSU",
      }),
    );
  } else if (psu.wattage < power.recommendedPsuW) {
    issues.push(
      issue({
        type: "warning",
        rule: "PSU_HEADROOM",
        title: "PSU is below recommended sizing",
        compatibilityIssue: `${psu.name} provides ${psu.wattage}W and covers the estimated ${power.estimatedLoadW}W load, but ${power.recommendedPsuW}W is recommended (25% headroom or the GPU vendor recommendation, whichever is higher).`,
        affectedParts,
        suggestedAction: "PSU",
      }),
    );
  }
  return issues;
}
