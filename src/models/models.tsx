import { readModel } from "./modelLoader";
import { useMemo } from "react";
import { Mesh } from "three";
import type { ModelEntry } from "./registry";
// Preserve source coordinates: CPU and RAM share the motherboard's coordinate
// system. Per-instance clones share cached geometry/materials without mutations.
export function ComponentModel({
  model,
  shadows,
}: {
  model: ModelEntry;
  shadows: boolean;
}) {
  const scene = readModel(model.url);
  const clone = useMemo(() => {
    const object = scene.clone(true);
    object.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = shadows;
        child.receiveShadow = shadows;
      }
    });
    return object;
  }, [scene, shadows]);
  return <primitive object={clone} dispose={null} />;
}
