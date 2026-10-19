import { expect, it } from "vitest";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { getBounds } from "@gltf-transform/functions";
import { MeshoptDecoder } from "meshoptimizer";
import { Box3, Euler, Matrix4, Quaternion, Vector3 } from "three";
import assets from "./assets.json";
import {
  placements,
  assemblySlots,
  ramSlots,
  ASSEMBLY_POSITION,
  ASSEMBLY_SCALE,
} from "./placement";
import { cpus } from "@/data/cpu";
import { ramKits } from "@/data/ram";
it("seats CPU and RAM in the board's source coordinate frame with alternating slots", () => {
  const slots = assemblySlots({ CPU: cpus[0], RAM: ramKits[0], STORAGE: [] });
  expect(slots.find((slot) => slot.slot === "cpu")!.item!.placement).toEqual(
    placements.motherboard,
  );
  expect(
    slots
      .filter((slot) => slot.slot.startsWith("ram-") && slot.item)
      .map((slot) => slot.slot),
  ).toEqual(["ram-1", "ram-3"]);
  expect(ramSlots(1)).toEqual([1]);
  expect(ramSlots(4)).toEqual([0, 1, 2, 3]);
  expect(ramSlots(0)).toEqual([]);
  expect(assemblySlots({ STORAGE: [] }).every((slot) => !slot.item)).toBe(true);
});
it("optimized extracted parts retain the original board alignment and stable case framing", async () => {
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  const source = await io.read(
    "assets/source-models/motherboard__components.glb",
  );
  for (const kind of ["cpu", "ram"] as const) {
    const original = getBounds(
      source
        .getRoot()
        .listNodes()
        .find((node) => node.getName() === kind.toUpperCase())!,
    );
    const extracted = await io.read(`public/${assets[kind].url}`);
    const actual = getBounds(extracted.getRoot().listScenes()[0]!);
    for (const edge of ["min", "max"] as const)
      for (let axis = 0; axis < 3; axis++)
        expect(actual[edge][axis]).toBeCloseTo(original[edge][axis]!, 3);
  }
  const caseModel = await io.read(`public/${assets.case.url}`);
  const bounds = getBounds(caseModel.getRoot().listScenes()[0]!);
  const midpoint = new Vector3(...bounds.min)
    .add(new Vector3(...bounds.max))
    .multiplyScalar(0.5);
  midpoint
    .multiplyScalar(placements.case!.scale)
    .add(new Vector3(...placements.case!.position))
    .multiplyScalar(ASSEMBLY_SCALE)
    .add(new Vector3(...ASSEMBLY_POSITION));
  expect(midpoint.length()).toBeLessThan(0.00001);
  expect(
    (bounds.max[1]! - bounds.min[1]!) * placements.case!.scale * ASSEMBLY_SCALE,
  ).toBeCloseTo(4.5);
  // Previous GPU rotation is preserved, rather than independently reorienting it.
  const rotation = new Matrix4().makeRotationY(placements.gpu!.rotation![1]);
  expect(new Vector3(1, 0, 0).applyMatrix4(rotation).z).toBeGreaterThan(0);
});

it("calibrated component envelopes remain within the case envelope", async () => {
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  const caseDoc = await io.read(`public/${assets.case.url}`);
  const caseBounds = getBounds(caseDoc.getRoot().listScenes()[0]!);
  const caseBox = new Box3(
    new Vector3(...caseBounds.min),
    new Vector3(...caseBounds.max),
  );
  caseBox.min.multiplyScalar(10).add(new Vector3(0, -1.8, 0));
  caseBox.max.multiplyScalar(10).add(new Vector3(0, -1.8, 0));
  for (const kind of ["motherboard", "cpu", "gpu", "psu", "ram"] as const) {
    const doc = await io.read(`public/${assets[kind].url}`);
    const bounds = getBounds(doc.getRoot().listScenes()[0]!);
    const placement = placements[kind === "ram" ? "motherboard" : kind]!;
    const matrix = new Matrix4().compose(
      new Vector3(...placement.position),
      new Quaternion().setFromEuler(
        new Euler(...(placement.rotation ?? [0, 0, 0])),
      ),
      new Vector3().setScalar(placement.scale),
    );
    const box = new Box3(
      new Vector3(...bounds.min),
      new Vector3(...bounds.max),
    ).applyMatrix4(matrix);
    expect(caseBox.clone().expandByScalar(0.02).containsBox(box), kind).toBe(
      true,
    );
  }
});
