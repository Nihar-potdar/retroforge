import { AnimatePresence, motion } from "motion/react";
import { getPartHighlights } from "@/lib/getPartHighlights";
import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useReducedMotion } from "motion/react";
import type { BUILD, CompatibleComponent } from "@/data/type";
import { installedModels, assemblyProfile } from "@/models/registry";
import { cameraKey, type CameraCommand } from "./cameraControls";
import type { SceneMetrics, SceneQuality } from "./BuilderScene";
const Scene = lazy(() => import("./BuilderScene"));
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-loading">
        <p>
          The 3D view could not start. You can still choose, check, and save
          parts.
        </p>
        <button
          className="control-button"
          onClick={() => this.setState({ failed: false })}
        >
          Retry 3D view
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function BuildViewport({
  build,
  selectedPart,
  selectedCategory,
}: {
  build: BUILD;
  selectedCategory?: string;
  selectedPart: CompatibleComponent | null;
}) {
  const reducedMotion = useReducedMotion();
  const controller = useRef<((command: CameraCommand) => void) | null>(null);
  const [quality, setQuality] = useState<SceneQuality>(() => {
    try {
      const stored = localStorage.getItem("retroforge.sceneQuality");
      return stored === "high" || stored === "low" ? stored : "auto";
    } catch {
      return "auto";
    }
  });
  const [metrics, setMetrics] = useState<SceneMetrics | null>(null);
  const [loaded, setLoaded] = useState(false);
  const onReady = useCallback(
    (value: ((command: CameraCommand) => void) | null) => {
      controller.current = value;
    },
    [],
  );
  const onLoaded = useCallback(() => setLoaded(true), []);
  const onMetrics = useCallback((value: SceneMetrics) => {
    setMetrics(value);
    window.dispatchEvent(
      new CustomEvent("retroforge:scene-metrics", { detail: value }),
    );
  }, []);
  const models = installedModels(build);
  const illustrative = models.some(
    (model) => model.fidelity === "illustrative",
  );
  const profile = assemblyProfile(build);
  return (
    <section
      className="relative h-full w-full overflow-hidden bg-surface viewport-vignette build-scene"
      aria-label="Interactive 3D assembly"
    >
      <SceneBoundary>
        <Suspense
          fallback={
            <div className="scene-loading" role="status">
              <p>Preparing the 3D workspace…</p>
              <p>Part selection and checks are already available.</p>
            </div>
          }
        >
          <Scene
            build={build}
            quality={quality}
            reducedMotion={Boolean(reducedMotion)}
            onReady={onReady}
            onMetrics={onMetrics}
            onLoaded={onLoaded}
          />
        </Suspense>
      </SceneBoundary>
      <div className="desktop-scene-heading cut-corner">
        <p className="font-mono text-xs uppercase tracking-widest text-accent-dark">
          Garage / Assembly
        </p>
        <p className="mt-1 font-display text-xl italic font-bold uppercase">
          {selectedCategory ?? "Your machine"}
        </p>
      </div>
      <div className="scene-caption">
        <p>
          {!build.CASE
            ? "Uncased assembly frame"
            : illustrative
              ? "Illustrative component models"
              : "Product model · fit is not simulated"}
        </p>
        <details>
          <summary>About this preview</summary>
          <p className="mt-2 max-w-sm">
            {profile.label}. This view does not verify cable routing, cooling,
            or exact clearance.
          </p>
          {models.map((model) => (
            <p key={`${model.kind}-${model.productId}`} className="mt-2">
              <a
                href={model.source}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {model.kind}: {model.author}
              </a>{" "}
              · {model.fidelity} · CC BY 4.0
            </p>
          ))}
        </details>
      </div>
      <details
        className="scene-toolbar scene-control-menu"
        onKeyDown={(event) => {
          if (event.key === "Escape" && event.currentTarget.open) {
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.open = false;
            event.currentTarget.querySelector<HTMLElement>("summary")?.focus();
          }
        }}
      >
        <summary className="control-button">View controls</summary>
        <div
          className="scene-controls-content"
          role="group"
          aria-label="3D camera controls"
        >
          <div
            tabIndex={0}
            className="control-button"
            role="group"
            aria-label="Camera keyboard control"
            aria-describedby="camera-help"
            onKeyDown={(event) => {
              if (event.altKey || event.ctrlKey || event.metaKey) return;
              const command = cameraKey(event.key);
              if (command) {
                event.preventDefault();
                controller.current?.(command);
              }
            }}
          >
            Camera
          </div>
          <button
            className="control-button"
            aria-label="Rotate camera left"
            disabled={!loaded}
            onClick={() => controller.current?.("left")}
          >
            ↶
          </button>
          <button
            className="control-button"
            aria-label="Rotate camera right"
            disabled={!loaded}
            onClick={() => controller.current?.("right")}
          >
            ↷
          </button>
          <button
            className="control-button"
            aria-label="Rotate camera up"
            disabled={!loaded}
            onClick={() => controller.current?.("up")}
          >
            ↑
          </button>
          <button
            className="control-button"
            aria-label="Rotate camera down"
            disabled={!loaded}
            onClick={() => controller.current?.("down")}
          >
            ↓
          </button>
          <button
            className="control-button"
            aria-label="Zoom in"
            disabled={!loaded}
            onClick={() => controller.current?.("in")}
          >
            ＋
          </button>
          <button
            className="control-button"
            aria-label="Zoom out"
            disabled={!loaded}
            onClick={() => controller.current?.("out")}
          >
            −
          </button>
          <button
            className="control-button"
            onClick={() => controller.current?.("reset")}
          >
            Reset view
          </button>
          <label className="control-button">
            Quality
            <select
              aria-label="Rendering quality"
              value={quality}
              onChange={(event) => {
                const value = event.target.value as SceneQuality;
                setQuality(value);
                try {
                  localStorage.setItem("retroforge.sceneQuality", value);
                } catch {
                  /* Session preference still works. */
                }
              }}
            >
              <option value="auto">Auto</option>
              <option value="high">High</option>
              <option value="low">Low</option>
            </select>
          </label>
          <details className="control-button">
            <summary>Help</summary>
            <p id="camera-help" className="max-w-xs text-xs">
              Drag to rotate; pinch or scroll to zoom. Focus Camera: arrows
              rotate, +/− zoom, Home resets.
            </p>
            {metrics && (
              <p className="text-xs">
                {metrics.quality} · {metrics.drawCalls} draws ·{" "}
                {metrics.triangles.toLocaleString()} triangles · frame p95{" "}
                {metrics.p95FrameMs}ms
              </p>
            )}
          </details>
        </div>
      </details>
      <div className="desktop-part-readout">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={
              selectedPart
                ? `${selectedPart.componentType}-${selectedPart.id}`
                : "empty"
            }
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="desktop-part-readout-card cut-corner accent-glow"
          >
            {selectedPart ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs uppercase text-accent-dark">
                      Inspecting / {selectedPart.componentType}
                    </p>
                    <h2 className="mt-1 font-display text-lg italic font-bold uppercase">
                      {selectedPart.name}
                    </h2>
                  </div>
                  <strong className="font-mono text-accent-dark">
                    ${selectedPart.price.toFixed(2)}
                  </strong>
                </div>
                <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                  {getPartHighlights(selectedPart).map((spec) => (
                    <div key={spec.label} className="text-xs">
                      <dt className="text-muted">{spec.label}</dt>
                      <dd className="font-mono">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <p className="font-mono text-xs uppercase text-muted">
                Select hardware / Begin assembly · Drag / Orbit · Scroll / Zoom
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {selectedPart && (
        <p className="sr-only">
          Inspecting {selectedPart.name}. Installation is controlled through the
          parts catalogue.
        </p>
      )}
    </section>
  );
}
