import { expect, test } from "@playwright/test";

test("desktop navigation and generator tabs are usable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop-only navigation");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Space, made visible." })).toBeVisible();
  await page.getByRole("button", { name: "Home Design", exact: true }).click();
  await expect(page.getByRole("heading", { name: "AI Interior Design" })).toBeVisible();
  await page.getByRole("button", { name: "Floor plans" }).click();
  await expect(page.getByRole("link", { name: /Floor Plan Generator/ }).first()).toBeVisible();
});

test("mobile drawer exposes real tools", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only interaction");
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("link", { name: "Floor Plan Editor", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Floor Plan Editor", exact: true }).click();
  await expect(page).toHaveURL(/floor-plan-editor/);
  await expect(page.getByRole("heading", { name: "AI Floor Plan Editor", exact: true }).first()).toBeVisible();
});

test("reference upload validates and previews locally", async ({ page }) => {
  await page.goto("/floor-plan-editor");
  const input = page.locator('input[type="file"]');
  await input.setInputFiles({ name: "plan.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64") });
  await expect(page.getByAltText("Reference 1")).toBeVisible();
  await expect(page.getByRole("button", { name: /Create with 1 credit/ })).toBeEnabled();
});

test("sign-in page and OAuth failure recovery remain reachable", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await page.goto("/auth/callback");
  await expect(page).toHaveURL(/\/auth\/sign-in\?error=oauth/);
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
});
