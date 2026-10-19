import { expect, it } from "vitest";
import {
  PART_MOTION,
  installationDirection,
  installationOffset,
} from "./transitionPolicy";
it("matches original exponential easing independent of frame rate", () => {
  expect(PART_MOTION.speed).toBe(8);
  expect(installationOffset([1, 0, 0], 0)).toEqual([1, 0, 0]);
  expect(installationOffset([1, 0, 0], 0.1)[0]).toBeCloseTo(Math.exp(-0.8));
  expect(installationOffset([0, -0.4, 0.5], 0.2)[1]).toBeCloseTo(
    -0.4 * Math.exp(-1.6),
  );
  expect(installationOffset([1, 0, 0], 3)).toEqual([0, 0, 0]);
});
it("uses the original per-component directions, extends them to CPU/RAM/storage, and leaves cases static", () => {
  expect(installationDirection("motherboard")).toEqual([0, 0, 0.5]);
  expect(installationDirection("cpu")).toEqual(
    installationDirection("motherboard"),
  );
  expect(installationDirection("ram")).toEqual(
    installationDirection("motherboard"),
  );
  expect(installationDirection("gpu")).toEqual([1, 0, 0]);
  expect(installationDirection("storage")).toEqual([1, 0, 0]);
  expect(installationDirection("psu")).toEqual([0, -0.4, 0.5]);
  expect(installationDirection("case")).toEqual([0, 0, 0]);
});
