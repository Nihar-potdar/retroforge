import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  Environment,
  Lightformer,
} from "@react-three/drei";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { orbitControlSurface } from "./orbitControlSurface";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { BUILD } from "@/data/type";
import { PcAssembly } from "./PcAssembly";
import type { CameraCommand } from "./cameraControls";
export type SceneQuality = "auto" | "high" | "low";
export type SceneMetrics = {
  frames: number;
  p95FrameMs: number;
  drawCalls: number;
  triangles: number;
  quality: "high" | "low";
};
const subscribeVisibility = (callback: () => void) => {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
};
const getVisibility = () => !document.hidden;
function SceneControls({
  onReady,
  onMetrics,
  quality,
  onSlow,
  onFast,
}: {
  onReady: (command: ((value: CameraCommand) => void) | null) => void;
  onMetrics: (metrics: SceneMetrics) => void;
  quality: "high" | "low";
  onSlow: () => void;
  onFast: () => void;
}) {
  const ref = useRef<OrbitControlsImpl>(null);
  const { invalidate, gl } = useThree();
  const controlSurface = useMemo(
    () => orbitControlSurface(gl.domElement),
    [gl],
  );
  const samples = useRef<number[]>([]);
  const stable = useRef(0);
  const windowStarted = useRef(0);
  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;
    controls.saveState();
    onReady((command) => {
      if (command === "reset") controls.reset();
      else if (command === "left" || command === "right")
        controls.setAzimuthalAngle(
          controls.getAzimuthalAngle() + (command === "left" ? -0.12 : 0.12),
        );
      else if (command === "up" || command === "down")
        controls.setPolarAngle(
          Math.max(
            0.15,
            Math.min(
              Math.PI / 2.05,
              controls.getPolarAngle() + (command === "up" ? -0.1 : 0.1),
            ),
          ),
        );
      else {
        const distance = controls.getDistance();
        const next = Math.max(
          5,
          Math.min(18, distance * (command === "in" ? 0.9 : 1.1)),
        );
        controls.object.position
          .sub(controls.target)
          .multiplyScalar(next / distance)
          .add(controls.target);
      }
      controls.update();
      invalidate();
    });
    return () => onReady(null);
  }, [onReady, invalidate]);
  useFrame((_, delta) => {
    const now = performance.now();
    // Exclude long idle pauses, but retain slow active frames for adaptation.
    if (delta > 3) {
      samples.current = [];
      windowStarted.current = now;
      return;
    }
    if (!windowStarted.current) windowStarted.current = now;
    samples.current.push(delta * 1000);
    if (
      samples.current.length < 30 &&
      (samples.current.length < 3 || now - windowStarted.current < 1500)
    )
      return;
    const sorted = [...samples.current].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)]!;
    onMetrics({
      frames: sorted.length,
      p95FrameMs: Math.round(p95 * 10) / 10,
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      quality,
    });
    if (p95 > 28) {
      stable.current = 0;
      onSlow();
    } else if (p95 < 18 && ++stable.current >= 3) {
      onFast();
      stable.current = 0;
    }
    samples.current = [];
    windowStarted.current = now;
  });
  return (
    <OrbitControls
      domElement={controlSurface}
      ref={ref}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      minDistance={5}
      maxDistance={18}
      maxPolarAngle={Math.PI / 2.05}
      target={[0, 0.2, 0]}
    />
  );
}
export default function BuilderScene({
  build,
  quality,
  reducedMotion,
  onReady,
  onMetrics,
  onLoaded,
}: {
  build: BUILD;
  quality: SceneQuality;
  reducedMotion: boolean;
  onReady: (command: ((value: CameraCommand) => void) | null) => void;
  onMetrics: (value: SceneMetrics) => void;
  onLoaded: () => void;
}) {
  const [adaptive, setAdaptive] = useState<"high" | "low">(() =>
    window.matchMedia("(max-width: 1023px)").matches ? "low" : "high",
  );
  const effective = quality === "auto" ? adaptive : quality;
  const visible = useSyncExternalStore(
    subscribeVisibility,
    getVisibility,
    () => true,
  );
  return (
    <Canvas
      frameloop={visible ? "demand" : "never"}
      shadows={effective === "high"}
      dpr={effective === "high" ? [1, 1.25] : [0.75, 1]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMappingExposure: 1.2,
      }}
      camera={{ position: [6.5, 3.5, 7.5], fov: 38 }}
      onCreated={({ camera, size }) => {
        if (size.width / size.height < 0.85)
          camera.position.multiplyScalar(0.85 / (size.width / size.height));
        performance.mark("retroforge:canvas-created");
        onLoaded();
      }}
    >
      <Environment resolution={64} frames={1}>
        <Lightformer
          intensity={4}
          position={[0, 5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 10, 1]}
        />
        <Lightformer
          intensity={3}
          position={[-5, 1, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[6, 8, 1]}
        />
        <Lightformer
          intensity={2}
          position={[3, 3, -4]}
          rotation={[0, Math.PI, 0]}
          scale={[5, 5, 1]}
        />
      </Environment>
      <hemisphereLight args={["#f4f7ff", "#777d87", 2.3]} />
      <directionalLight
        position={[6, 7, 6]}
        intensity={3}
        color="#f4efe6"
        castShadow={effective === "high"}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.001}
      />
      <directionalLight
        position={[-4, 2, -3]}
        intensity={1.2}
        color="#b9cdff"
      />
      <PcAssembly
        build={build}
        shadows={effective === "high"}
        reducedMotion={reducedMotion}
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2.29, 0]}
        receiveShadow
      >
        <planeGeometry args={[30, 30]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>
      <Grid
        position={[0, -2.3, 0]}
        args={[32, 32]}
        cellSize={0.5}
        cellThickness={0.45}
        sectionSize={2.5}
        sectionColor="#5d6b82"
        sectionThickness={1.05}
        cellColor="#77736b"
        fadeDistance={22}
        fadeStrength={1.3}
        infiniteGrid
      />
      <SceneControls
        onReady={onReady}
        onMetrics={onMetrics}
        quality={effective}
        onSlow={() => {
          if (quality === "auto") setAdaptive("low");
        }}
        onFast={() => {
          if (quality === "auto") setAdaptive("high");
        }}
      />
    </Canvas>
  );
}
