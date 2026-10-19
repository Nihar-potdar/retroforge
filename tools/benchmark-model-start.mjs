import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader"],
});
const runs = [];
try {
  for (const device of ["desktop", "phone"]) {
    const context = await browser.newContext({
      viewport:
        device === "phone"
          ? { width: 393, height: 851 }
          : { width: 1440, height: 900 },
    });
    await context.addInitScript(() =>
      localStorage.setItem("retroforge.onboarding.v1", "dismissed"),
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 80,
      downloadThroughput: 1000000,
      uploadThroughput: 500000,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", {
      rate: device === "phone" ? 4 : 1,
    });
    await page.goto("http://127.0.0.1:4175/#/prebuilts");
    await page
      .getByRole("button", { name: "Use build", exact: true })
      .first()
      .click();
    await page.waitForFunction(
      () =>
        performance
          .getEntriesByType("mark")
          .filter((e) => e.name.startsWith("retroforge:model-ready:"))
          .length === 6,
      {},
      { timeout: 120000 },
    );
    runs.push(
      await page.evaluate(
        ({ device, errors }) => ({
          device,
          errors,
          canvas: performance.getEntriesByName("retroforge:canvas-created")[0]
            ?.startTime,
          models: performance
            .getEntriesByType("resource")
            .filter((e) => /\.glb/.test(e.name))
            .map((e) => ({
              url: e.name.split("/").pop(),
              start: e.startTime,
              end: e.responseEnd,
              transfer: e.transferSize,
            })),
          ready: performance
            .getEntriesByType("mark")
            .filter((e) => e.name.startsWith("retroforge:model-ready:"))
            .map((e) => e.startTime),
        }),
        { device, errors },
      ),
    );
    await page.screenshot({
      path: `/tmp/model-start-${process.argv[2]}-${device}.png`,
    });
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(
  `docs/model-start-${process.argv[2]}.json`,
  JSON.stringify(
    {
      conditions:
        "One cold visit/device; 80ms latency, 1MB/s; phone 4x CPU; software GPU. Times since navigation.",
      runs,
    },
    null,
    2,
  ) + "\n",
);
console.log(JSON.stringify(runs));
