import type { BUILD } from "@/data/type";
import { corsair4000DTransforms } from "@/components/configs/corsair4000D";
import { resolveModel, type ModelEntry } from "./registry";
export type Vec3 = [number, number, number];
export type Placement = { position: Vec3; rotation?: Vec3; scale: number };
export type AssemblyItem = {
  key: string;
  placement: Placement;
  model: ModelEntry | null;
};
export type AssemblySlot = { slot: string; item: AssemblyItem | null };
// Bounds of the optimized case in source coordinates. One common transform
// preserves the old mounting calibration and a stable 4.5-unit case height.
export const CASE_SOURCE_BOUNDS = {
  min: [-0.2184562683105469, -0.015563756227493286, -0.12931517569383863],
  max: [0.2309565544128418, 0.44900467512283204, 0.10069382073546262],
};
export const ASSEMBLY_SCALE =
  4.5 / ((CASE_SOURCE_BOUNDS.max[1]! - CASE_SOURCE_BOUNDS.min[1]!) * 10);
export const ASSEMBLY_POSITION: Vec3 = CASE_SOURCE_BOUNDS.min.map(
  (min, index) =>
    -(
      ((min + CASE_SOURCE_BOUNDS.max[index]!) / 2) * 10 +
      (index === 1 ? -1.8 : 0)
    ) * ASSEMBLY_SCALE,
) as Vec3;
export const placements: Record<string, Placement> = {
  case: { position: [0, -1.8, 0], scale: 10 },
  motherboard: corsair4000DTransforms.motherboard,
  cpu: corsair4000DTransforms.motherboard,
  gpu: corsair4000DTransforms.gpu,
  psu: corsair4000DTransforms.psu,
};
// Source RAM groups occupy these exact X offsets relative to the extracted RAM.
export const RAM_SLOT_OFFSETS = [
  0, 0.29821140691637993, 0.5904169231653214, 0.8754526525735855,
];
export function ramSlots(modules: number): number[] {
  return [[], [1], [1, 3], [0, 1, 3], [0, 1, 2, 3]][
    Math.max(0, Math.min(4, Math.floor(modules)))
  ]!;
}
export function assemblySlots(build: BUILD): AssemblySlot[] {
  const parts = [
    build.CASE,
    build.MOTHERBOARD,
    build.CPU,
    build.GPU,
    build.PSU,
  ];
  const kinds = ["case", "motherboard", "cpu", "gpu", "psu"];
  const slots = parts.map((part, index) => ({
    slot: kinds[index]!,
    item: part
      ? {
          key: `${part.componentType}:${part.id}:${part.name}`,
          placement: placements[kinds[index]!]!,
          model: resolveModel(part),
        }
      : null,
  }));
  const installedSlots = ramSlots(
    build.RAM ? Number.parseInt(build.RAM.modules, 10) || 1 : 0,
  );
  for (let index = 0; index < 4; index++) {
    const part = installedSlots.includes(index) ? build.RAM : undefined;
    const board = placements.motherboard!;
    slots.push({
      slot: `ram-${index}`,
      item: part
        ? {
            key: `RAM:${part.id}:${part.name}:${index}`,
            placement: {
              ...board,
              position: [
                board.position[0] + RAM_SLOT_OFFSETS[index]! * board.scale,
                board.position[1],
                board.position[2],
              ],
            },
            model: resolveModel(part),
          }
        : null,
    });
  }
  return slots;
}
export function storageItems(build: BUILD): AssemblySlot[] {
  return build.STORAGE.map((drive, index) => ({
    slot: `storage-${drive.instanceId}`,
    item: {
      key: drive.instanceId,
      model: null,
      placement: { position: [0.8, -1.45 + index * 0.12, 0.1], scale: 1 },
    },
  }));
}
