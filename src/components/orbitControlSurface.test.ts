// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { orbitControlSurface } from "./orbitControlSurface";

describe("OrbitControls pointer capture boundary", () => {
  it("ignores uncaptured and already cancelled pointers", () => {
    const canvas = document.createElement("canvas");
    canvas.hasPointerCapture = vi.fn(() => false);
    canvas.releasePointerCapture = vi.fn(() => {
      throw new DOMException("Invalid pointer id", "NotFoundError");
    });
    const surface = orbitControlSurface(canvas);
    expect(() => surface.releasePointerCapture(42)).not.toThrow();
    expect(canvas.releasePointerCapture).not.toHaveBeenCalled();
  });

  it("releases owned capture and preserves real DOM method receivers", () => {
    const canvas = document.createElement("canvas");
    canvas.hasPointerCapture = vi.fn(() => true);
    canvas.releasePointerCapture = vi.fn();
    const originalRelease = canvas.releasePointerCapture;
    const surface = orbitControlSurface(canvas);
    surface.releasePointerCapture(7);
    expect(originalRelease).toHaveBeenCalledWith(7);
    expect(canvas.releasePointerCapture).toBe(originalRelease);
    const listener = vi.fn();
    surface.addEventListener("pointercancel", listener);
    canvas.dispatchEvent(new Event("pointercancel"));
    expect(listener).toHaveBeenCalledOnce();
    surface.removeEventListener("pointercancel", listener);
    canvas.dispatchEvent(new Event("pointercancel"));
    expect(listener).toHaveBeenCalledOnce();
  });
});
