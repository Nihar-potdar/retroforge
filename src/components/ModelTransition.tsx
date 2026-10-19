import { useState } from "react";
import type { AssemblyItem } from "@/models/placement";
import { ComponentModel } from "@/models/models";
import { InstallAnimation } from "./InstallAnimation";
import { installationDirection } from "./transitionPolicy";
export function AssemblyModel({
  item,
  shadows,
  animate = false,
}: {
  item: AssemblyItem;
  shadows: boolean;
  animate?: boolean;
}) {
  const model = item.model ? (
    <ComponentModel model={item.model} shadows={shadows} />
  ) : (
    <mesh castShadow={shadows}>
      <boxGeometry args={[0.7, 0.07, 0.45]} />
      <meshStandardMaterial color="#51616d" metalness={0.4} roughness={0.6} />
    </mesh>
  );
  const kind = item.model?.kind ?? "storage";
  return (
    <group {...item.placement} name={`installed:${item.key}`}>
      {animate && kind !== "case" ? (
        <InstallAnimation offset={installationDirection(kind)}>
          {model}
        </InstallAnimation>
      ) : (
        model
      )}
    </group>
  );
}
// Selection is the render source of truth. Removal and replacement never retain
// an obsolete model waiting for a frame, timer, or exit animation.
export function ModelTransition({
  item,
  shadows,
  animate,
}: {
  item: AssemblyItem | null;
  shadows: boolean;
  animate: boolean;
}) {
  const [presentation, setPresentation] = useState({ key: item?.key, animate });
  if (presentation.key !== item?.key || (!animate && presentation.animate)) {
    setPresentation({ key: item?.key, animate });
  }
  return (
    item && (
      <AssemblyModel
        key={item.key}
        item={item}
        shadows={shadows}
        animate={presentation.animate}
      />
    )
  );
}
