import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { LoadingManager, type Group } from "three";
type Resource = {
  status: "pending" | "ready" | "failed";
  promise: Promise<void>;
  scene?: Group;
  error?: unknown;
};
const resources = new Map<string, Resource>();
const queue: (() => void)[] = [];
let active = 0;
function pump() {
  while (active < 2 && queue.length) {
    active++;
    queue.shift()!();
  }
}
export function readModel(url: string): Group {
  let resource = resources.get(url);
  if (!resource) {
    resource = { status: "pending", promise: Promise.resolve() };
    const target = resource;
    target.promise = new Promise<void>((resolve) => {
      queue.push(() => {
        const manager = new LoadingManager();
        const loader = new GLTFLoader(manager).setMeshoptDecoder(
          MeshoptDecoder,
        );
        let timeout: ReturnType<typeof setTimeout>;
        const deadline = new Promise<never>((_, reject) => {
          timeout = setTimeout(() => {
            manager.abort();
            reject(
              new Error(
                "Model download timed out. Retry when your connection is available.",
              ),
            );
          }, 30000);
        });
        Promise.race([loader.loadAsync(url), deadline])
          .then(
            (gltf) => {
              target.scene = gltf.scene;
              target.status = "ready";
              performance.mark(`retroforge:model-ready:${url}`);
            },
            (error) => {
              target.error = error;
              target.status = "failed";
            },
          )
          .finally(() => {
            clearTimeout(timeout);
            active--;
            resolve();
            pump();
          });
      });
    });
    resources.set(url, target);
    pump();
  }
  if (resource.status === "failed") throw resource.error;
  if (resource.status === "pending") throw resource.promise;
  return resource.scene!;
}
export function clearModel(url: string) {
  resources.delete(url);
}
