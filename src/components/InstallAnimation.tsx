import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode } from "react";
import type { Group } from "three";
import type { Vec3 } from "@/models/placement";
import { installationOffset } from "./transitionPolicy";
export function InstallAnimation({
  children,
  offset,
}: {
  children: ReactNode;
  offset: Vec3;
}) {
  const ref = useRef<Group>(null);
  const started = useRef<number | null>(null);
  const done = useRef(false);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [invalidate]);
  useFrame(() => {
    if (!ref.current || done.current) return;
    const now = performance.now();
    started.current ??= now;
    const position = installationOffset(offset, (now - started.current) / 1000);
    ref.current.position.set(...position);
    done.current = position.every((axis) => axis === 0);
    if (!done.current) invalidate();
  });
  return (
    <group ref={ref} position={offset}>
      {children}
    </group>
  );
}
