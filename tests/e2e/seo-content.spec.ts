import { expect, test } from "@playwright/test";

const target = {
  path: "/floor-plan-to-3d",
  title: "Floor Plan to 3D Rendering Tool | Home Design AI",
  description: "Convert a 2D floor plan to a furnished 3D-style rendering online. Explore materials and room relationships while keeping the original layout visible.",
  h1: "Floor Plan to 3D Rendering",
  marker: "Convert a floor plan to a 3D-style image without rebuilding it by hand.",
} as const;

test("the rendering page exposes focused metadata and server-rendered intent content", async ({ page, request }) => {
  const response = await request.get(target.path);
  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain(target.marker);

  await page.goto(target.path);
  await expect(page).toHaveTitle(target.title);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", target.description);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://homedesignai.co${target.path}`);
  await expect(page.getByRole("heading", { level: 1, name: target.h1, exact: true })).toHaveCount(1);
  await expect(page.getByText(target.marker, { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Compare credit pricing/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /AI Floor Plan Generator/i })).toBeVisible();
  await expect(page.locator('meta[name="keywords"]')).toHaveCount(0);
});

test("commercial copy keeps free-credit and 3D output claims accurate", async ({ page }) => {
  await page.goto("/floor-plan-to-3d");
  await expect(page.getByText("It does not create an editable 3D model, BIM file, CAD file, or geometry you can orbit and revise in professional modeling software.")).toBeVisible();
  await page.locator("details").filter({ hasText: "Is a floorplan render a downloadable 3D model?" }).locator("summary").click();
  await expect(page.getByText("Downloaded results are images intended for visualization and communication.", { exact: false })).toBeVisible();
  await expect(page.getByText(/New accounts receive 3 signup credits/).first()).toBeVisible();
});

test("public legal and affiliate pages expose self-referencing canonicals", async ({ page }) => {
  for (const path of ["/affiliate", "/privacy", "/terms"]) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://homedesignai.co${path}`);
  }
});

test("the sitemap lists only the 34 intended public URLs without synthetic lastmod values", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);

  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

  expect(urls).toHaveLength(34);
  expect(new Set(urls).size).toBe(34);
  expect(urls.every((url) => url.startsWith("https://homedesignai.co"))).toBe(true);
  expect(xml).not.toContain("<lastmod>");
  expect(urls.some((url) => /\/(?:account|history|auth|api)(?:\/|$)/.test(new URL(url).pathname))).toBe(false);
});
