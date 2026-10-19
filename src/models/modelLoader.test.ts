import { beforeEach, expect, it, vi } from "vitest";
import { Group } from "three";
const requests = vi.hoisted(
  () =>
    [] as {
      url: string;
      resolve: (value: { scene: Group }) => void;
      reject: (error: Error) => void;
    }[],
);
vi.mock("three/addons/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    setMeshoptDecoder() {
      return this;
    }
    loadAsync(url: string) {
      return new Promise((resolve, reject) =>
        requests.push({ url, resolve, reject }),
      );
    }
  },
}));
beforeEach(() => {
  vi.resetModules();
  requests.length = 0;
});
it("limits concurrent requests, caches readiness, and starts queued work as a slot finishes", async () => {
  const { readModel } = await import("./modelLoader");
  const pending: unknown[] = [];
  for (const url of ["one", "two", "three"]) {
    try {
      readModel(url);
    } catch (promise) {
      pending.push(promise);
    }
  }
  expect(requests.map((r) => r.url)).toEqual(["one", "two"]);
  const scene = new Group();
  requests[0]!.resolve({ scene });
  await pending[0];
  expect(requests.map((r) => r.url)).toEqual(["one", "two", "three"]);
  expect(readModel("one")).toBe(scene);
  requests[1]!.resolve({ scene: new Group() });
  requests[2]!.resolve({ scene: new Group() });
  await Promise.all(pending);
});
it("preserves an error until retry clears it, without blocking other requests", async () => {
  const { readModel, clearModel } = await import("./modelLoader");
  let pending: unknown;
  try {
    readModel("broken");
  } catch (promise) {
    pending = promise;
  }
  const error = Error("download failed");
  requests[0]!.reject(error);
  await pending;
  expect(() => readModel("broken")).toThrow(error);
  clearModel("broken");
  expect(() => readModel("broken")).toThrow();
  expect(requests).toHaveLength(2);
  requests[1]!.resolve({ scene: new Group() });
});
it("times out stalled downloads and releases queue slots", async () => {
  vi.useFakeTimers();
  try {
    const { readModel } = await import("./modelLoader");
    const pending: unknown[] = [];
    for (const url of ["stalled-one", "stalled-two", "queued"]) {
      try {
        readModel(url);
      } catch (promise) {
        pending.push(promise);
      }
    }
    await vi.advanceTimersByTimeAsync(30000);
    await Promise.all(pending.slice(0, 2));
    expect(() => readModel("stalled-one")).toThrow("timed out");
    expect(requests.map((request) => request.url)).toEqual([
      "stalled-one",
      "stalled-two",
      "queued",
    ]);
    requests[2]!.resolve({ scene: new Group() });
    await pending[2];
  } finally {
    vi.useRealTimers();
  }
});
