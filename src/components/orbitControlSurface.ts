/**
 * three-stdlib releases capture on every pointerup/pointercancel, including
 * pointers it never captured. Firefox rejects stale pointer IDs. Keep this
 * guard local to OrbitControls, without replacing methods on the real canvas
 * or swallowing unrelated DOM exceptions.
 */
export function orbitControlSurface(
  canvas: HTMLCanvasElement,
): HTMLCanvasElement {
  return new Proxy(canvas, {
    get(target, property) {
      if (property === "releasePointerCapture")
        return (pointerId: number) => {
          if (target.hasPointerCapture(pointerId))
            target.releasePointerCapture(pointerId);
        };
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
