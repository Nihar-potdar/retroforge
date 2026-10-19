import { compatibilityRules } from "./CompatibilityRules";
import { assessBuild } from "./BuildAssessment";
export { assessBuild } from "./BuildAssessment";
import type {
  CompatibleComponent,
  CompatibilityResult,
  BUILD,
  DetailedErrors,
} from "../../data/type";

// importing Rules used in compatibilty engine
const RULES = compatibilityRules();

// Adapter.

export function buildToComponents(build: BUILD): CompatibleComponent[] {
  const singleParts: Array<CompatibleComponent | undefined> = [
    build.CPU,
    build.GPU,
    build.RAM,
    build.PSU,
    build.CASE,
    build.MOTHERBOARD,
  ];

  const selectedParts = singleParts.filter(
    (part): part is CompatibleComponent => part !== undefined,
  );

  const storageParts = build.STORAGE.map((drive) => drive.product);

  return [...selectedParts, ...storageParts];
}

// Checks one components against every single other component in the database (component compatibility is defined in CompatibliityRules.tsx). can be used when user is choosing componets and for filtering incompatible components

export function compatibilityEngine(
  selectedComponent: CompatibleComponent,
  chosenComponents?: CompatibleComponent[],
): CompatibilityResult[] {
  const rule = RULES[selectedComponent.componentType];

  if (!rule) return [];

  const targetTypes = new Set(rule.target.map((part) => part.componentType));
  const targets = chosenComponents
    ? chosenComponents.filter((part) => targetTypes.has(part.componentType))
    : rule.target;

  return targets.map((targetComponent) => {
    const checkResult = rule.check(selectedComponent, targetComponent);
    const result =
      typeof checkResult === "boolean"
        ? { isCompatible: checkResult }
        : checkResult;

    return {
      selectedComponent: selectedComponent.name,
      targetComponent: targetComponent.name,
      isCompatible: result.isCompatible,
      error: "error" in result ? result.error : undefined,
    };
  });
}

/** Legacy component-array adapter. New application code should call assessBuild(BUILD). */
export function componentsToBuild(components: CompatibleComponent[]): BUILD {
  const build: BUILD = { STORAGE: [] };
  for (const component of components) {
    switch (component.componentType) {
      case "CPU":
        build.CPU = component;
        break;
      case "GPU":
        build.GPU = component;
        break;
      case "RAM":
        build.RAM = component;
        break;
      case "PSU":
        build.PSU = component;
        break;
      case "Motherboard":
        build.MOTHERBOARD = component;
        break;
      case "Case":
        build.CASE = component;
        break;
      case "Storage":
        build.STORAGE.push({
          instanceId: `legacy-drive-${build.STORAGE.length}`,
          product: component,
        });
        break;
    }
  }
  return build;
}

export function validateBuild(
  components: CompatibleComponent[],
): CompatibilityResult[] {
  return assessBuild(componentsToBuild(components)).issues.map((error) => ({
    selectedComponent: error.source?.name ?? "Selected build",
    targetComponent: error.target?.name ?? "System requirements",
    isCompatible: error.type !== "error",
    error,
  }));
}

export function getDetailedErrors(
  components: CompatibleComponent[],
): DetailedErrors[] {
  return assessBuild(componentsToBuild(components)).issues;
}
