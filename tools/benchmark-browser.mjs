import { chromium } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
// Cache states are separate metrics: a warm context may still revalidate assets
// according to server Cache-Control. Each cold run starts a fresh browser context.
const urls = {
  baseline: process.env.BASELINE_URL ?? "http://127.0.0.1:4174",
  optimized: process.env.OPTIMIZED_URL ?? "http://127.0.0.1:4175",
};
const browser = await chromium.launch({
  headless: true,
  args: ["--enable-unsafe-swiftshader"],
});
const runs = [];
try {
  for (const [version, url] of Object.entries(urls))
    for (const device of ["desktop", "phone"])
      for (let iteration = 0; iteration < 2; iteration++) {
        const context = await browser.newContext({
          viewport:
            device === "phone"
              ? { width: 393, height: 851 }
              : { width: 1440, height: 900 },
          deviceScaleFactor: 1,
        });
        await context.addInitScript(() => {
          localStorage.setItem("retroforge.onboarding.v1", "dismissed");
          window.sceneMetrics = [];
          window.addEventListener("retroforge:scene-metrics", (event) =>
            window.sceneMetrics.push(event.detail),
          );
        });
        for (const cache of ["cold", "warm"]) {
          console.log("Starting", version, device, cache, iteration);
          const page = await context.newPage();
          const cdp = await context.newCDPSession(page);
          await cdp.send("Network.enable");
          await cdp.send("Network.emulateNetworkConditions", {
            offline: false,
            latency: 80,
            downloadThroughput: 1_000_000,
            uploadThroughput: 500_000,
          });
          await cdp.send("Emulation.setCPUThrottlingRate", {
            rate: device === "phone" ? 4 : 1,
          });
          const responses = [];
          let bytes = 0,
            modelBytes = 0;
          const errors = [];
          page.on("pageerror", (error) => errors.push(error.message));
          page.on("response", (response) => {
            if (response.url().startsWith(url))
              responses.push(
                response
                  .body()
                  .then((body) => {
                    bytes += body.length;
                    if (response.url().endsWith(".glb"))
                      modelBytes += body.length;
                  })
                  .catch(() => {}),
              );
          });
          await page.goto(`${url}/#/prebuilts`);
          const action = page
            .getByRole("button", { name: "Use build", exact: true })
            .first();
          await action.waitFor();
          const start = performance.now();
          await action.click();
          await page
            .getByRole("heading", { name: "Build your machine", exact: true })
            .waitFor();
          const controlsMs = Math.round(performance.now() - start);
          await page.locator("canvas").waitFor();
          const canvasCreatedMs = Math.round(performance.now() - start);
          await page.waitForFunction(
            (expected) =>
              performance
                .getEntriesByType("resource")
                .filter((e) => /\.glb/.test(e.name) && e.responseEnd > 0)
                .length >= expected,
            version === "baseline" ? 4 : 6,
            { timeout: 90000 },
          );
          const modelDownloadsMs = Math.round(performance.now() - start);
          console.log("Models downloaded", version, modelDownloadsMs);
          if (version === "optimized")
            await page.waitForFunction(
              () =>
                performance
                  .getEntriesByType("mark")
                  .filter((e) => e.name.startsWith("retroforge:model-ready:"))
                  .length === 6,
            );
          const modelsDecodedMs =
            version === "optimized"
              ? Math.round(performance.now() - start)
              : null;
          await page.waitForTimeout(1500);
          const canvas = page.locator("canvas");
          const bounds = await canvas.boundingBox();
          const frameTimingPromise = page.evaluate(
            () =>
              new Promise((resolve) => {
                const intervals = [];
                let last = performance.now();
                const end = last + 2000;
                function frame(now) {
                  intervals.push(now - last);
                  last = now;
                  if (now < end) requestAnimationFrame(frame);
                  else {
                    intervals.sort((a, b) => a - b);
                    resolve({
                      rafMedianMs:
                        intervals[Math.floor(intervals.length * 0.5)],
                      rafP95Ms: intervals[Math.floor(intervals.length * 0.95)],
                    });
                  }
                }
                requestAnimationFrame(frame);
              }),
          );
          if (bounds) {
            await page.mouse.move(
              bounds.x + bounds.width * 0.5,
              bounds.y + bounds.height * 0.45,
            );
            await page.mouse.down();
            await page.mouse.move(
              bounds.x + bounds.width * 0.7,
              bounds.y + bounds.height * 0.55,
              { steps: 5 },
            );
            await page.mouse.up();
          }
          const frameTiming = await frameTimingPromise;
          await Promise.race([
            Promise.allSettled(responses),
            new Promise((resolve) => setTimeout(resolve, 5000)),
          ]);
          const resourceTiming = await page.evaluate(() =>
            performance
              .getEntriesByType("resource")
              .filter((e) => /\.glb/.test(e.name))
              .map((e) => ({
                url: e.name,
                durationMs: e.duration,
                transferSize: e.transferSize,
                decodedBodySize: e.decodedBodySize,
              })),
          );
          const sceneMetrics = await page.evaluate(() => window.sceneMetrics);
          runs.push({
            version,
            device,
            cache,
            iteration,
            controlsMs,
            canvasCreatedMs,
            modelDownloadsMs,
            modelsDecodedMs,
            responseBodyBytes: bytes,
            modelResponseBytes: modelBytes,
            modelTransferBytes: resourceTiming.reduce(
              (n, r) => n + r.transferSize,
              0,
            ),
            ...frameTiming,
            sceneMetrics,
            resourceTiming,
            errors,
          });
          await page.screenshot({
            path: `/tmp/retroforge-${version}-${device}-complete.png`,
          });
          console.log(
            version,
            device,
            cache,
            controlsMs,
            modelDownloadsMs,
            frameTiming,
          );
          await page.close();
        }
        await context.close();
      }
} finally {
  await browser.close();
  await mkdir("docs", { recursive: true });
  const productionIndexHash = createHash("sha256")
    .update(await readFile("dist/index.html"))
    .digest("hex");
  await writeFile(
    "docs/browser-benchmark.json",
    JSON.stringify(
      {
        conditions: {
          networkBytesPerSecond: 1_000_000,
          latencyMs: 80,
          phoneCPUThrottle: 4,
          browser: "headless Chromium / software GPU",
          productionIndexHash,
          metric:
            "Cold/warm browser contexts; bytes include same-origin responses only. Response body bytes are decoded. RAF is a responsiveness proxy, not GPU frame timing. ModelsDecoded is instrumented only in the optimized build.",
        },
        runs,
      },
      null,
      2,
    ) + "\n",
  );
}
