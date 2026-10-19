import type {
  BUILD,
  BuildAssessment,
  CompatibleComponent,
  DetailedErrors,
} from "@/data/type";
import { checkPair } from "./CompatibilityRules";
import { issue, reference } from "./Issue";
import { estimatePowerUsage, powerIssues } from "./Power";

/** Single source of truth for selected builds, previews, saves and prebuilts. */
export function assessBuild(build: BUILD): BuildAssessment {
  const issues: DetailedErrors[] = [];
  const check = (
    selected?: CompatibleComponent,
    target?: CompatibleComponent,
    instanceId?: string,
  ) => {
    if (!selected || !target) return;
    const result = checkPair(selected, target, instanceId);
    if (result && !result.isCompatible) issues.push(result.error);
  };
  check(build.CPU, build.MOTHERBOARD);
  check(build.RAM, build.MOTHERBOARD);
  check(build.GPU, build.CASE);
  check(build.CASE, build.MOTHERBOARD);
  for (const drive of build.STORAGE)
    check(drive.product, build.MOTHERBOARD, drive.instanceId);

  const motherboard = build.MOTHERBOARD;
  if (motherboard) {
    for (const connector of ["M.2", "SATA"] as const) {
      const drives = build.STORAGE.filter(
        (drive) => drive.product.connector === connector,
      );
      const available =
        connector === "M.2" ? motherboard.m2Slots : motherboard.sataPorts;
      // Zero connectors already produce actionable per-drive connector issues.
      if (available > 0 && drives.length > available) {
        issues.push(
          issue(
            {
              type: "error",
              rule: "STORAGE_CAPACITY",
              title: `Not enough ${connector} connections`,
              compatibilityIssue: `${drives.length} ${connector} drives are installed, but ${motherboard.name} has ${available} connections. Remove ${drives.length - available} drive(s) or choose a motherboard with more connections.`,
              affectedParts: [
                reference(motherboard, `${available} ${connector} connections`),
                ...drives.map((drive) =>
                  reference(drive.product, connector, drive.instanceId),
                ),
              ],
              suggestedAction: "STORAGE",
            },
            connector,
          ),
        );
      }
    }
  }
  const power = estimatePowerUsage(build);
  issues.push(...powerIssues(build, power));
  return { issues, power };
}
