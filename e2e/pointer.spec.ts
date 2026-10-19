import { test, expect } from "@playwright/test";

test("orbit drag survives stale cancellation, outside release and route teardown", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() =>
    localStorage.setItem("retroforge.onboarding.v1", "dismissed"),
  );
  await page.goto("/#/build");
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();
  await page.waitForFunction(
    () => performance.getEntriesByName("retroforge:canvas-created").length > 0,
  );
  // OrbitControls registers its DOM listeners in an effect after Canvas creation.
  await page.waitForTimeout(300);
  const bounds = (await canvas.boundingBox())!;
  const x = bounds.x + bounds.width / 2,
    y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 35, y + 15, { steps: 4 });
  await page.mouse.move(2, 2);
  await page.mouse.up();
  // Firefox throws for these inactive IDs without the capture ownership guard.
  await canvas.evaluate((element) => {
    element.dispatchEvent(
      new PointerEvent("pointercancel", { pointerId: 987654, bubbles: true }),
    );
    element.dispatchEvent(
      new PointerEvent("pointercancel", { pointerId: 987654, bubbles: true }),
    );
  });
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 40, y + 20, { steps: 4 });
  await page.mouse.up();
  await page.mouse.down();
  await page.evaluate(() => {
    window.location.hash = "/guides";
  });
  await expect(canvas).toHaveCount(0);
  await page.mouse.up();
  await page.goto("/#/build");
  await expect(canvas).toBeVisible();
  await canvas.click();
  expect(errors).toEqual([]);
});
