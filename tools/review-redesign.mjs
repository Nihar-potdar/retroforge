import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader"],
});
const results = [];
try {
  for (const [device, width, height] of [
    ["desktop", 1440, 1000],
    ["tablet", 768, 1024],
    ["phone", 390, 844],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    await context.addInitScript(() =>
      localStorage.setItem("retroforge.onboarding.v1", "dismissed"),
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const [name, route] of [
      ["home", "/"],
      ["guides", "/guides"],
      ["prebuilts", "/prebuilts"],
      ["builder", "/build"],
      ["article", "/guides/compatibility-first"],
    ]) {
      await page.goto(`http://127.0.0.1:5173/#${route}`);
      await page.locator("h1").waitFor();
      await page.evaluate(() => document.fonts.ready);
      if (name === "builder") {
        await page.locator("canvas").waitFor();
        await page.waitForTimeout(2500);
      } else await page.waitForTimeout(400);
      // Trigger every lazy image before a full-page capture, then return to the top.
      if (name !== "builder") {
        await page.evaluate(async () => {
          for (
            let y = 0;
            y < document.documentElement.scrollHeight;
            y += innerHeight
          ) {
            scrollTo(0, y);
            await new Promise((resolve) => setTimeout(resolve, 60));
          }
          await Promise.all(
            [...document.images].map((img) => img.decode().catch(() => {})),
          );
          scrollTo(0, 0);
        });
      }
      results.push({
        device,
        name,
        ...(await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          heading: document.querySelector("h1")?.textContent,
          font: getComputedStyle(document.querySelector("h1")).fontFamily,
          brokenImages: [...document.images]
            .filter((i) => i.complete && !i.naturalWidth)
            .map((i) => i.src),
        }))),
        errors: [...errors],
      });
      await page.screenshot({
        path: `/tmp/retroforge-design-${device}-${name}.png`,
        fullPage: name !== "builder",
      });
      if (name === "home") {
        await page.getByRole("button", { name: "Memory", exact: true }).click();
        if (
          !(await page
            .getByRole("heading", { name: "Room to think." })
            .isVisible())
        )
          throw Error("Memory explainer failed");
        await page
          .getByRole("button", { name: "Storage", exact: true })
          .click();
        if (
          !(await page
            .getByRole("heading", { name: "Keep the good stuff." })
            .isVisible())
        )
          throw Error("Storage explainer failed");
      }
      if (name === "guides") {
        await page
          .getByRole("button", { name: "Advanced", exact: true })
          .click();
        if ((await page.locator(".guide-item").count()) === 0)
          throw Error("Advanced filter empty");
        await page
          .getByRole("searchbox", { name: "Find a guide" })
          .fill("no-match-test");
        if (
          !(await page
            .getByText("No guides match that search.", { exact: false })
            .isVisible())
        )
          throw Error("Search empty state failed");
      }
    }
    await page.goto("http://127.0.0.1:5173/#/");
    await page.locator("h1").waitFor();
    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    await page.evaluate(() =>
      Promise.all(
        [...document.images].map((img) => {
          img.loading = "eager";
          return img.decode().catch(() => {});
        }),
      ),
    );
    await page.screenshot({
      path: `/tmp/retroforge-design-${device}-dark.png`,
      fullPage: true,
    });
    await context.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
await writeFile(
  "/tmp/retroforge-design-review.json",
  JSON.stringify(results, null, 2),
);
