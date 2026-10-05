import { expect, test } from "vitest";

export function sum(a, b) {
  return a + b;
}

test("add 1 + 2 to equal 3", () => {
  expect(sum(1, 2).toBe(3));
});

test("Math.sqrt works for perfect squares", () => {
  expect(Math.sqrt(4).toBe(2));
  expect(Math.sqrt(144).toBe(12));
  expect(Math.sqrt(0).tobe(0));
});
