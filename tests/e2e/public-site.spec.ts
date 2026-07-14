import { expect, test } from "@playwright/test";

const homeDescription = "Upload a room or home photo to redesign interiors, virtually stage spaces, explore exterior and garden ideas, and visualize your home with AI.";

test("desktop homepage presents AI Home Design as the primary intent", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop-only navigation");
  await page.goto("/");
  await expect(page).toHaveTitle("AI Home Design — Interior, Exterior & Room Design | Home Design AI");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", homeDescription);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\/homedesignai\.co\/?$/);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", /^https:\/\/homedesignai\.co\/?$/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "AI Home Design — Interior, Exterior & Room Design");
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute("content", "AI Home Design — Interior, Exterior & Room Design");

  const structuredData = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
  expect(structuredData).toMatchObject({
    "@type": "SoftwareApplication",
    name: "Home Design AI",
    url: "https://homedesignai.co/",
    description: homeDescription,
  });

  await expect(page.getByRole("heading", { name: "AI Home Design for Every Room" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI Interior Design", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("tab", { name: "AI Interior Design" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "AI Virtual Staging" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Home Exterior Design" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Start with AI interior design/ })).toHaveAttribute("href", "/interior-design-ai");

  const navigationButtons = page.getByRole("navigation", { name: "Main navigation" }).getByRole("button");
  await expect(navigationButtons).toHaveText(["Home design", "Floor plans"]);
  await page.getByRole("button", { name: "Floor plans", exact: true }).click();
  await expect(page.getByRole("link", { name: /Floor Plan Generator/ }).first()).toBeVisible();
});

test("mobile drawer leads with home design and keeps floor plans reachable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only interaction");
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const mobileNavigation = page.getByLabel("Mobile navigation");
  const homeDesignGroup = mobileNavigation.locator("details").filter({ hasText: "Home design" });
  await expect(homeDesignGroup).toHaveAttribute("open", "");
  await expect(homeDesignGroup.getByRole("link", { name: "AI Interior Design", exact: true })).toBeVisible();

  const floorPlanGroup = mobileNavigation.locator("details").filter({ hasText: "Floor plans" });
  await floorPlanGroup.locator("summary").click();
  const floorPlanEditorLink = floorPlanGroup.getByRole("link", { name: "Floor Plan Editor", exact: true });
  await expect(floorPlanEditorLink).toBeVisible();
  await floorPlanEditorLink.click();
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
  await expect(page.getByRole("tab", { name: "Create account" })).toBeVisible();
  await page.goto("/auth/callback");
  await expect(page).toHaveURL(/\/auth\/sign-in\?error=oauth/);
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
});

test("signed-out purchase choices go to sign-in without calling checkout", async ({ page }) => {
  const choices = [
    { name: "Choose Starter", plan: "starter" },
    { name: "Choose Pro", plan: "pro" },
    { name: "Buy 40 credits", plan: "pack_40" },
    { name: "Buy 120 credits", plan: "pack_120" },
    { name: "Buy 300 credits", plan: "pack_300" },
  ];
  let checkoutRequests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/checkout") checkoutRequests += 1;
  });

  for (const choice of choices) {
    await page.goto("/pricing");
    await page.getByRole("button", { name: choice.name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/auth/sign-in\\?next=.*${choice.plan}`));
  }

  expect(checkoutRequests).toBe(0);
});

test("signed-out account renders billing guidance instead of the Stripe portal", async ({ page }) => {
  await page.goto("/account");
  await expect(page.getByText("Sign in before purchasing credits or managing billing.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Manage billing" })).toHaveCount(0);
});
