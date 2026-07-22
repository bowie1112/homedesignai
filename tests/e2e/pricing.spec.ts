import { expect, test } from "@playwright/test";

test("pricing publishes the v2 catalog and truthful model limits", async ({ page }) => {
  await page.goto("/pricing");

  await expect(page.getByRole("tab", { name: "Monthly" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("$9.99", { exact: true })).toBeVisible();
  await expect(page.getByText("$29.99", { exact: true })).toBeVisible();
  await expect(page.getByText("$59.99", { exact: true })).toBeVisible();
  await expect(page.getByText("100 credits each month", { exact: true })).toBeVisible();
  await expect(page.getByText("Up to 100 Basic or 33 Pro generations", { exact: true })).toBeVisible();
  await expect(page.getByText("Basic uses 1 credit for a 1K image. Pro uses 3 credits for a 2K image. Mix both models whenever you need them.", { exact: true })).toBeVisible();

  await page.getByRole("tab", { name: /Yearly/ }).click();
  await expect(page.getByText("$95.90 billed annually", { exact: true })).toBeVisible();
  await expect(page.getByText("3,600 credits granted annually", { exact: true })).toBeVisible();
  await expect(page.getByText("Save 20% vs monthly", { exact: true }).first()).toBeVisible();

  await page.getByRole("tab", { name: "One-time" }).click();
  await expect(page.getByText("$6.99", { exact: true })).toBeVisible();
  await expect(page.getByText("$24.99", { exact: true })).toBeVisible();
  await expect(page.getByText("500 permanent credits", { exact: true })).toBeVisible();
  await expect(page.getByRole("main")).not.toContainText(/4K quality export|DXF export|Priority processing|Floor Plan Project/);
});
