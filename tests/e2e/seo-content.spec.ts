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

const legalPages = [
  {
    path: "/privacy",
    title: "Privacy Policy | Home Design AI",
    description: "How Home Design AI handles account data, private uploads, AI generation requests, payments, analytics, retention, and privacy choices.",
    h1: "Privacy Policy",
    headings: ["Information we collect", "AI generation and third-party processing", "Retention and deletion", "Your privacy choices and rights"],
    marker: "third-party AI processing providers",
    toc: "AI generation and third-party processing",
  },
  {
    path: "/terms",
    title: "Terms of Service | Home Design AI",
    description: "The rules for using Home Design AI, including credits, subscriptions, refunds, acceptable use, AI outputs, and design disclaimers.",
    h1: "Terms of Service",
    headings: ["Credits, subscriptions, and billing", "Refunds and cancellations", "AI outputs", "Design and construction disclaimer"],
    marker: "Failed model jobs are eligible for an automatic credit return",
    toc: "Credits, subscriptions, and billing",
  },
] as const;

test("public legal and affiliate pages expose self-referencing canonicals", async ({ page }) => {
  for (const path of ["/affiliate", ...legalPages.map((legalPage) => legalPage.path)]) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://homedesignai.co${path}`);
  }
});

for (const legalPage of legalPages) {
  test(`${legalPage.path} exposes complete legal copy without internal provider names`, async ({ page, request }) => {
    const response = await request.get(legalPage.path);
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html).toContain("July 16, 2026");
    expect(html).toContain(legalPage.marker);
    expect(html).not.toMatch(/\bKIE\b|kie\.ai/i);

    await page.goto(legalPage.path);
    await expect(page).toHaveTitle(legalPage.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", legalPage.description);
    await expect(page.getByRole("heading", { level: 1, name: legalPage.h1, exact: true })).toHaveCount(1);
    await expect(page.getByText("Last updated July 16, 2026", { exact: true })).toBeVisible();
    await expect(page.getByLabel("On this page").getByRole("link", { name: new RegExp(legalPage.toc, "i") })).toBeVisible();
    await expect(page.locator('a[href="mailto:hello@homedesignai.co"]').last()).toBeVisible();

    for (const heading of legalPage.headings) {
      await expect(page.getByRole("heading", { level: 2, name: heading, exact: true })).toBeVisible();
    }
  });
}

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
