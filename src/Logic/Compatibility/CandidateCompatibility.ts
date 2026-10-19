import type { BUILD, CompatibleComponent, DetailedErrors } from "@/data/type";
import { assessBuild } from "./BuildAssessment";
import { hasCompatibilityErrors } from "./Issue";

export function buildWithCandidate(
  currentBuild: BUILD,
  candidate: CompatibleComponent,
): BUILD {
  switch (candidate.componentType) {
    case "CPU":
      return {
        ...currentBuild,
        CPU: candidate,
      };
    case "GPU":
      return {
        ...currentBuild,
        GPU: candidate,
      };

    case "RAM":
      return {
        ...currentBuild,
        RAM: candidate,
      };

    case "PSU":
      return {
        ...currentBuild,
        PSU: candidate,
      };

    case "Case":
      return {
        ...currentBuild,
        CASE: candidate,
      };

    case "Motherboard":
      return {
        ...currentBuild,
        MOTHERBOARD: candidate,
      };
    case "Storage":
      return {
        ...currentBuild,
        STORAGE: [
          ...currentBuild.STORAGE,
          {
            instanceId: `compatibility-preview-${candidate.id}-${currentBuild.STORAGE.length}`,
            product: candidate,
          },
        ],
      };
  }
}

export function getCandidateCompatibilityIssues(
  currentBuild: BUILD,
  candidate: CompatibleComponent,
): DetailedErrors[] {
  const proposedBuild = buildWithCandidate(currentBuild, candidate);
  const proposed = assessBuild(proposedBuild);
  const current = assessBuild(currentBuild);
  const worsensCapacity =
    proposed.power.estimatedLoadW > current.power.estimatedLoadW;
  const worsensRecommendation =
    proposed.power.recommendedPsuW > current.power.recommendedPsuW;
  const previewInstance =
    candidate.componentType === "Storage"
      ? proposedBuild.STORAGE.at(-1)?.instanceId
      : undefined;

  return proposed.issues.filter((entry) => {
    // PSU sizing is a system-level rule; assigning its source to an arbitrary CPU is misleading.
    if (entry.rule === "PSU_WATTAGE")
      return candidate.componentType === "PSU" || worsensCapacity;
    if (entry.rule === "PSU_HEADROOM")
      return candidate.componentType === "PSU" || worsensRecommendation;
    if (
      entry.rule === "POWER_DATA_INCOMPLETE" &&
      candidate.componentType === "PSU"
    )
      return true;
    return entry.affectedParts.some(
      (part) =>
        part.componentType === candidate.componentType &&
        part.id === candidate.id &&
        (candidate.componentType !== "Storage" ||
          part.instanceId === previewInstance),
    );
  });
}

export function isCandidateCompatible(
  currentBuild: BUILD,
  candidate: CompatibleComponent,
): boolean {
  return !hasCompatibilityErrors(
    getCandidateCompatibilityIssues(currentBuild, candidate),
  );
}

export function componentKey(component: CompatibleComponent): string {
  return `${component.componentType}-${component.id}`;
}
