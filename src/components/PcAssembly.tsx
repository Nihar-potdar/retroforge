import { Component, Suspense, useState, type ReactNode } from "react";
import type { BUILD } from "@/data/type";
import {
  assemblySlots,
  storageItems,
  ASSEMBLY_POSITION,
  ASSEMBLY_SCALE,
} from "@/models/placement";
import { useBuildStore } from "@/stores/BuildStore";
import { ModelTransition, AssemblyModel } from "./ModelTransition";
import { Html } from "@react-three/drei";
class ModelBoundary extends Component<
  { children: ReactNode; name: string },
  { failed: boolean; name: string }
> {
  state = { failed: false, name: this.props.name };
  static getDerivedStateFromProps(
    props: { name: string },
    state: { name: string },
  ) {
    return props.name === state.name
      ? null
      : { failed: false, name: props.name };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed && !this.props.name) return null;
    return this.state.failed ? (
      <Html center>
        <button
          className="control-button"
          onClick={() => {
            clearModel(this.props.name);
            this.setState({ failed: false });
          }}
        >
          Model unavailable · Retry
        </button>
      </Html>
    ) : (
      this.props.children
    );
  }
}
// Retry owns the loader URL, so a failed cache entry does not remain permanent.
import { clearModel } from "@/models/modelLoader";
export function PcAssembly({
  build,
  shadows,
  reducedMotion,
}: {
  build: BUILD;
  shadows: boolean;
  reducedMotion: boolean;
}) {
  const revision = useBuildStore((state) => state.revision);
  const intent = useBuildStore((state) => state.intent);
  const [initialRevision] = useState(revision);
  const animate =
    !reducedMotion && intent === "edit" && revision !== initialRevision;
  return (
    <group>
      {!build.CASE && (
        <mesh position={[0, -2.2, 0]}>
          <boxGeometry args={[3.3, 0.05, 2.8]} />
          <meshStandardMaterial color="#778293" wireframe />
        </mesh>
      )}
      <group position={ASSEMBLY_POSITION} scale={ASSEMBLY_SCALE}>
        {[...assemblySlots(build), ...storageItems(build)].map(
          ({ slot, item }) => (
            <ModelBoundary key={slot} name={item?.model?.url ?? ""}>
              <Suspense
                fallback={
                  <Html center>
                    <span className="model-loading-label">Loading model…</span>
                  </Html>
                }
              >
                {slot === "case" ? (
                  item && <AssemblyModel item={item} shadows={shadows} />
                ) : (
                  <ModelTransition
                    item={item}
                    shadows={shadows}
                    animate={animate}
                  />
                )}
              </Suspense>
            </ModelBoundary>
          ),
        )}
      </group>
    </group>
  );
}
