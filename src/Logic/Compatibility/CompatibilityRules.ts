import { motherboards } from "@/data/motherboard";
import { ramKits } from "@/data/ram";
import { cases } from "@/data/case";
import { cpus } from "@/data/cpu";
import { gpus } from "@/data/gpu";
import { storageDevices } from "@/data/storage";
import type {
  CompatibleComponent,
  ComponentType,
  CompatibilityRule,
  DetailedErrors,
  RuleCheckResult,
} from "@/data/type";
import { issue, reference } from "./Issue";

const formFactorSize = { "Mini ITX": 1, "Micro ATX": 2, ATX: 3 };

/** Undefined means these categories have no supported pair rule. */
export function checkPair(
  selected: CompatibleComponent,
  target: CompatibleComponent,
  instanceId?: string,
): RuleCheckResult | undefined {
  let details: Omit<DetailedErrors, "key" | "type" | "affectedParts"> &
    Required<Pick<DetailedErrors, "source" | "target">>;

  if (
    selected.componentType === "CPU" &&
    target.componentType === "Motherboard"
  ) {
    if (selected.socket === target.socket) return { isCompatible: true };
    details = {
      rule: "CPU_MOTHERBOARD_SOCKET",
      title: "CPU and motherboard sockets do not match",
      compatibilityIssue: `${selected.name} uses socket ${selected.socket}, but ${target.name} uses ${target.socket}.`,
      source: reference(selected, selected.socket),
      target: reference(target, target.socket),
      suggestedAction: "MOTHERBOARD",
    };
  } else if (
    selected.componentType === "RAM" &&
    target.componentType === "Motherboard"
  ) {
    if (selected.type === target.ramType) return { isCompatible: true };
    details = {
      rule: "RAM_MOTHERBOARD_TYPE",
      title: "RAM generation is unsupported by the motherboard",
      compatibilityIssue: `${selected.name} is ${selected.type}, but ${target.name} supports ${target.ramType}.`,
      source: reference(selected, selected.type),
      target: reference(target, target.ramType),
      suggestedAction: "RAM",
    };
  } else if (
    selected.componentType === "GPU" &&
    target.componentType === "Case"
  ) {
    if (selected.length <= target.maxGpuLength) return { isCompatible: true };
    details = {
      rule: "GPU_CASE_CLEARANCE",
      title: "GPU is too long for the case",
      compatibilityIssue: `${selected.name} is ${selected.length} mm long, but ${target.name} supports up to ${target.maxGpuLength} mm.`,
      source: reference(selected, `${selected.length} mm`),
      target: reference(target, `${target.maxGpuLength} mm`),
      suggestedAction: "CASE",
    };
  } else if (
    selected.componentType === "Case" &&
    target.componentType === "Motherboard"
  ) {
    if (
      formFactorSize[selected.formFactor] >= formFactorSize[target.formFactor]
    )
      return { isCompatible: true };
    details = {
      rule: "MOTHERBOARD_CASE_FORM_FACTOR",
      title: "Motherboard is too large for the case",
      compatibilityIssue: `${selected.name} supports up to ${selected.formFactor}, but ${target.name} is ${target.formFactor}.`,
      source: reference(selected, selected.formFactor),
      target: reference(target, target.formFactor),
      suggestedAction: "CASE",
    };
  } else if (
    selected.componentType === "Storage" &&
    target.componentType === "Motherboard"
  ) {
    const slots =
      selected.connector === "M.2" ? target.m2Slots : target.sataPorts;
    const supportsProtocol =
      selected.connector === "M.2"
        ? target.supportedM2Protocols.includes(selected.protocol)
        : selected.protocol === "SATA";
    if (slots > 0 && supportsProtocol) return { isCompatible: true };
    details = {
      rule: slots === 0 ? "STORAGE_CONNECTOR" : "STORAGE_PROTOCOL",
      title:
        slots === 0
          ? "Storage connector is unavailable"
          : "Storage protocol is unsupported",
      compatibilityIssue:
        slots === 0
          ? `${target.name} has no ${selected.connector} connections for ${selected.name}.`
          : `${target.name} does not support ${selected.protocol} over ${selected.connector} for ${selected.name}.`,
      source: reference(
        selected,
        `${selected.connector} / ${selected.protocol}`,
        instanceId,
      ),
      target: reference(
        target,
        `${slots} ${selected.connector} connections; ${target.supportedM2Protocols.join(", ")} M.2 protocols`,
      ),
      suggestedAction: "STORAGE",
    };
  } else if (
    (selected.componentType === "Motherboard" &&
      ["CPU", "RAM", "Case", "Storage"].includes(target.componentType)) ||
    (selected.componentType === "Case" && target.componentType === "GPU")
  ) {
    return checkPair(target, selected, instanceId);
  } else {
    return undefined;
  }

  return {
    isCompatible: false,
    error: issue({
      ...details,
      type: "error",
      affectedParts: [details.source, details.target],
    }),
  };
}

/** Catalogue-wide pair checks are separate from whole-build assessment. */
export function compatibilityRules(): Partial<
  Record<ComponentType, CompatibilityRule>
> {
  const rule = (target: CompatibleComponent[]): CompatibilityRule => ({
    target,
    check: (selected, other) =>
      checkPair(selected, other) ?? { isCompatible: true },
  });
  return {
    CPU: rule(motherboards),
    RAM: rule(motherboards),
    GPU: rule(cases),
    Storage: rule(motherboards),
    Case: rule([...motherboards, ...gpus]),
    Motherboard: rule([...cpus, ...ramKits, ...cases, ...storageDevices]),
  };
}
