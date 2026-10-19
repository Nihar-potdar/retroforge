import { test, expect } from "@playwright/test";
test("first visit is dismissible and Help replays it", async ({ page }) => {
  await page.goto("/#/build");
  await expect(page.getByRole("dialog")).toContainText("Welcome to RetroForge");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Help", exact: true }).first().click();
  await expect(page.getByRole("dialog")).toContainText("Keyboard controls");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("keyboard installs parts, saves, uses Zen, and dismisses panels", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() =>
    localStorage.setItem("retroforge.onboarding.v1", "dismissed"),
  );
  await page.goto("/#/build");
  const phone = info.project.name === "phone";
  if (phone) await page.getByRole("button", { name: "＋ Add parts" }).click();
  const root = phone
    ? page.getByRole("dialog")
    : page.getByRole("complementary", { name: "component catalogue" });
  const install = root
    .getByRole("button", {
      name: phone ? /^Install AMD Ryzen/ : /^Select AMD Ryzen/,
    })
    .first();
  await install.focus();
  await page.keyboard.press("Enter");
  await expect(
    root.getByRole("button", { name: /^Remove AMD Ryzen/ }).first(),
  ).toBeVisible();
  if (phone) {
    await page
      .getByRole("button", { name: "Expand panel for reading" })
      .click();
    await expect(
      page.getByRole("button", { name: "Compact panel" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Your build", exact: true }).click();
  }
  await page
    .getByRole("textbox", { name: "Build name" })
    .fill("Keyboard draft");
  await page.getByRole("button", { name: "Save", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Load Keyboard draft" }),
  ).toBeVisible();
  if (phone) await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Zen mode", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Exit Zen · Esc" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }),
  ).toHaveCount(0);
  if (!phone) {
    await page
      .getByRole("button", { name: "Show component catalogue" })
      .focus();
    const panel = page.getByRole("complementary", {
      name: "component catalogue",
    });
    await expect(panel).toHaveCSS("opacity", "1");
  }
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Zen mode", exact: true }),
  ).toBeFocused();
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByText("View controls", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Rotate camera left" }),
  ).toBeEnabled();
  await page
    .getByRole("group", { name: "Camera keyboard control", exact: true })
    .focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Home");
  await page.screenshot({
    path: `/tmp/retroforge-${info.project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("tour preserves the build and guide deep links open the correct category", async ({
  page,
}, info) => {
  await page.addInitScript(() =>
    localStorage.setItem("retroforge.onboarding.v1", "dismissed"),
  );
  await page.goto("/#/build");
  await page.getByRole("button", { name: "Help", exact: true }).first().click();
  await page.getByRole("button", { name: "Take builder tour" }).click();
  await expect(
    page
      .getByRole("dialog")
      .filter({ hasText: "Start with a component category" }),
  ).toBeVisible();
  for (let i = 0; i < 5; i++)
    await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/#/guides/power-without-guessing");
  await page.getByRole("link", { name: "Choose psu", exact: true }).click();
  if (info.project.name === "phone")
    await page.getByRole("button", { name: "＋ Add parts" }).click();
  const root =
    info.project.name === "phone"
      ? page.getByRole("dialog")
      : page.getByRole("complementary", { name: "component catalogue" });
  if (info.project.name === "phone")
    await expect(
      root.getByRole("combobox", { name: "Component category" }),
    ).toHaveValue("psu");
  else
    await expect(
      root.getByRole("button", { name: "Power supply", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
});
test("a complete build loads six independent assets and survives resize", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() =>
    localStorage.setItem("retroforge.onboarding.v1", "dismissed"),
  );
  await page.goto("/#/prebuilts");
  await page
    .getByRole("button", { name: "Use build", exact: true })
    .first()
    .click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForFunction(
    () =>
      performance
        .getEntriesByType("mark")
        .filter((entry) => entry.name.startsWith("retroforge:model-ready:"))
        .length === 6,
  );
  await expect(
    page.getByText("Illustrative component models", { exact: true }),
  ).toBeVisible();
  if (info.project.name === "phone") {
    await page.setViewportSize({ width: 851, height: 393 });
    await expect(
      page.getByRole("button", { name: "＋ Add parts" }),
    ).toBeVisible();
    await page.setViewportSize({ width: 320, height: 640 });
    await expect(
      page.getByRole("button", { name: "＋ Add parts" }),
    ).toBeVisible();
  }
  await page.screenshot({
    path: `/tmp/retroforge-${info.project.name}-assembled.png`,
  });
  expect(errors).toEqual([]);
});
test("a failed model is recoverable while other parts and checks remain usable", async ({
  page,
}, info) => {
  await page.addInitScript(() =>
    localStorage.setItem("retroforge.onboarding.v1", "dismissed"),
  );
  await page.route("**/models/optimized/cpu-*.glb", (route) => route.abort());
  await page.goto("/#/prebuilts");
  await page
    .getByRole("button", { name: "Use build", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Model unavailable · Retry" }),
  ).toBeVisible();
  if (info.project.name === "phone")
    await page.getByRole("button", { name: "Your build", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Build name" })).toBeVisible();
  if (info.project.name === "phone") await page.keyboard.press("Escape");
  await page.unroute("**/models/optimized/cpu-*.glb");
  await page.getByRole("button", { name: "Model unavailable · Retry" }).click();
  await expect(
    page.getByRole("button", { name: "Model unavailable · Retry" }),
  ).toHaveCount(0);
});
test("storage-disabled browsers still start, dismiss welcome, and change theme", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Disabled", "SecurityError");
      },
    }),
  );
  await page.goto("/#/build");
  await expect(page.getByRole("dialog")).toContainText("Welcome to RetroForge");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: /Switch to .* mode/ }).click();
  await expect(page.locator("h1")).toContainText("Build your machine");
  expect(errors).toEqual([]);
});
test("guide navigation and modal focus work through the keyboard", async ({
  page,
}, info) => {
  await page.addInitScript(() =>
    localStorage.setItem("retroforge.onboarding.v1", "dismissed"),
  );
  await page.goto("/#/build");
  if (info.project.name === "phone") {
    await page.getByText("Menu", { exact: true }).focus();
    await page.keyboard.press("Enter");
  }
  const guideLink = page.getByRole("link", { name: "Guides", exact: true });
  await guideLink.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("h1")).toContainText("Less mystery");
  const advanced = page.getByRole("button", { name: "Advanced", exact: true });
  await advanced.focus();
  await page.keyboard.press(" ");
  await expect(
    page.getByText("Tuning With Measurements and Recovery", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Help", exact: true }).click();
  const dialog = page.getByRole("dialog");
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    await expect
      .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)))
      .toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Help", exact: true }),
  ).toBeFocused();
});

test("starting case is named, removable, restored by Reset, and never injected into a saved build", async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    localStorage.setItem("retroforge.onboarding.v1", "dismissed");
    localStorage.setItem(
      "retroforge.savedBuilds",
      JSON.stringify([
        { id: "empty", name: "Case-free draft", build: { STORAGE: [] } },
      ]),
    );
  });
  await page.goto("/#/build");
  const notice = page.getByRole("status", { name: "Starting case" });
  await expect(notice).toContainText("Corsair 4000D Airflow");
  await page
    .getByRole("button", { name: "Dismiss starting case message" })
    .click();
  await expect(notice).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Build your machine", exact: true }),
  ).toBeFocused();
  const phone = info.project.name === "phone";
  if (phone)
    await page.getByRole("button", { name: "Your build", exact: true }).click();
  const root = phone
    ? page.getByRole("dialog")
    : page.getByRole("complementary", { name: "installed build" });
  await expect(
    root.getByText("Corsair 4000D Airflow", { exact: true }),
  ).toBeVisible();
  await root
    .getByRole("button", { name: "Remove Corsair 4000D Airflow", exact: true })
    .click();
  await expect(
    root
      .getByText("Case", { exact: true })
      .locator("..")
      .getByText("Not installed", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(
    root.getByText("Corsair 4000D Airflow", { exact: true }),
  ).toBeVisible();
  if (phone) await page.keyboard.press("Escape");
  await expect(notice).toContainText("Corsair 4000D Airflow");
  if (phone)
    await page.getByRole("button", { name: "Your build", exact: true }).click();
  await page.getByRole("button", { name: "Load Case-free draft" }).click();
  await expect(
    root
      .getByText("Case", { exact: true })
      .locator("..")
      .getByText("Not installed", { exact: true }),
  ).toBeVisible();
  if (phone) await page.keyboard.press("Escape");
  await expect(notice).toHaveCount(0);
  await expect(
    page.getByText("Uncased assembly frame", { exact: true }),
  ).toBeVisible();
});

test("browse and build use route defaults, while a chosen theme and photo inspection remain usable", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("retroforge.onboarding.v1", "dismissed"),
  );
  await page.goto("/#/");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  const inspect = page.getByRole("button", { name: /^Inspect NVIDIA/ });
  await inspect.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").locator("img")).toHaveAttribute(
    "src",
    /2400\.webp$/,
  );
  await page.keyboard.press("Escape");
  await expect(inspect).toBeFocused();
  await page.getByRole("link", { name: "Start building", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.goto("/#/guides");
  await expect(page.locator("h1")).toContainText("Less mystery");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.goto("/#/");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
