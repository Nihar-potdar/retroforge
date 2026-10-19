import { test, expect } from "@playwright/test";
test("builder normal operations do not log errors or fail requests", async ({
  page,
}, info) => {
  const errors: string[] = [],
    warnings: string[] = [],
    failed: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
    if (message.type() === "warning") warnings.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) =>
    failed.push(`${request.url()}: ${request.failure()?.errorText}`),
  );
  await page.addInitScript(() =>
    localStorage.setItem("retroforge.onboarding.v1", "dismissed"),
  );
  await page.goto("/#/prebuilts");
  await page
    .getByRole("button", { name: "Use build", exact: true })
    .first()
    .click();
  await page.waitForFunction(
    () =>
      performance
        .getEntriesByType("mark")
        .filter((e) => e.name.startsWith("retroforge:model-ready:")).length ===
      6,
  );
  const phone = info.project.name === "phone";
  if (phone)
    await page.getByRole("button", { name: "Your build", exact: true }).click();
  const root = phone
    ? page.getByRole("dialog")
    : page.getByRole("complementary", { name: "installed build" });
  await root
    .getByRole("button", { name: /^Remove AMD Ryzen/ })
    .first()
    .click();
  if (phone) await page.keyboard.press("Escape");
  await page.getByText("View controls", { exact: true }).click();
  await page
    .getByRole("combobox", { name: "Rendering quality" })
    .selectOption("high");
  await page.getByRole("button", { name: "Rotate camera left" }).click();
  await page
    .getByRole("combobox", { name: "Rendering quality" })
    .selectOption("low");
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  await page.waitForTimeout(1000);
  console.log(
    JSON.stringify({ device: info.project.name, errors, warnings, failed }),
  );
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});
