import type {
  CompatibleComponent,
  ComponentRefernce,
  DetailedErrors,
} from "@/data/type";

export function reference(
  part: CompatibleComponent,
  value: string,
  instanceId?: string,
): ComponentRefernce {
  return {
    id: part.id,
    name: part.name,
    componentType: part.componentType,
    value,
    instanceId,
  };
}

export function partKey(part: ComponentRefernce): string {
  return `${part.componentType}-${part.id}${part.instanceId ? `-${part.instanceId}` : ""}`;
}

export function issue(
  details: Omit<DetailedErrors, "key">,
  qualifier = "",
): DetailedErrors {
  return {
    ...details,
    key: `${details.rule}:${qualifier}:${details.affectedParts.map(partKey).sort().join(":")}`,
  };
}

export function hasCompatibilityErrors(issues: DetailedErrors[]): boolean {
  return issues.some((entry) => entry.type === "error");
}
