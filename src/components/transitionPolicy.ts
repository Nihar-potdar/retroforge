import type { Vec3 } from "@/models/placement";
// Original GitHub easing: lerp toward the mounting point at speed 8.
export const PART_MOTION = { speed: 8, settleDistance: 0.002 } as const;
export function installationOffset(offset: Vec3, elapsedSeconds: number): Vec3 {
  const decay = Math.exp(-PART_MOTION.speed * Math.max(0, elapsedSeconds));
  const value = offset.map((axis) => axis * decay) as Vec3;
  return Math.hypot(...value) <= PART_MOTION.settleDistance ? [0, 0, 0] : value;
}
export function installationDirection(kind: string): Vec3 {
  if (kind === "case") return [0, 0, 0];
  if (kind === "gpu" || kind === "storage") return [1, 0, 0];
  if (kind === "psu") return [0, -0.4, 0.5];
  return [0, 0, 0.5];
}
