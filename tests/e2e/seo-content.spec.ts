import { expect, test } from "@playwright/test";

const priorityPages = [
  {
    path: "/",
    title: "AI Home Design — Interior, Exterior & Room Design | Home Design AI",
    description: "Upload a room or home photo to redesign interiors, virtually stage spaces, explore exterior and garden ideas, and visualize your home with AI.",
    h1: "AI Home Design for Every Room",
    marker: "Connect the room photo, the floor plan, and the decision.",
    link: "AI floor plan generator",
  },
  {
    path: "/floor-plan-to-3d",
    title: "Floor Plan to 3D Rendering Tool | Home Design AI",
    description: "Convert a 2D floor plan to a furnished 3D-style rendering online. Explore materials and room relationships while keeping the original layout visible.",
    h1: "Floor Plan to 3D Render",
    marker: "Convert a floor plan to a 3D-style image without rebuilding it by hand.",
    link: "Credit Pricing",
  },
  {
    path: "/floor-plan-generator",
    title: "AI Floor Plan Generator from Text | Home Design AI",
    description: "Turn a written room brief into a furnished floor plan concept with an AI floor plan generator. Start with 3 signup credits and refine layouts online.",
    h1: "AI Floor Plan Generator",
    marker: "Turn a room brief into a visual layout with an AI floor plan generator.",
    link: "AI Floor Plan Editor",
  },
  {
    path: "/interior-design-ai",
    title: "AI Room Design & Interior Design Tool | Home Design AI",
    description: "Upload a room photo and use an AI interior design tool to explore furniture, materials, color, and lighting while preserving the existing architecture.",
    h1: "AI Interior Design",
    marker: "Redesign the room you have instead of starting from an empty template.",
    link: "AI Virtual Staging",
  },
  {
    path: "/ai-home-exterior-design-free",
    title: "AI Home Exterior Design & Remodel Visualizer | Home Design AI",
    description: "Upload a house photo to explore AI home exterior design ideas for facades, paint, materials, doors, windows, and planting before a renovation.",
    h1: "AI Home Exterior Design",
    marker: "Explore a house exterior redesign while keeping the existing building recognizable.",
    link: "AI Landscape Design",
  },
] as const;

test("priority landing pages expose unique metadata and server-rendered intent content", async ({ page, request }) => {
  for (const target of priorityPages) {
    const response = await request.get(target.path);
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain(target.marker);

    await page.goto(target.path);
    await expect(page).toHaveTitle(target.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", target.description);
    const canonical = target.path === "/" ? "https://homedesignai.co" : `https://homedesignai.co${target.path}`;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
    await expect(page.getByRole("heading", { level: 1, name: target.h1, exact: true })).toHaveCount(1);
    await expect(page.getByText(target.marker, { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(target.link, "i") }).first()).toBeVisible();
    await expect(page.locator('meta[name="keywords"]')).toHaveCount(0);
  }
});

test("commercial copy keeps free-credit and 3D output claims accurate", async ({ page }) => {
  await page.goto("/floor-plan-to-3d");
  await expect(page.getByText("It does not create an editable 3D model, BIM file, CAD file, or geometry you can orbit and revise in professional modeling software.")).toBeVisible();
  await page.locator("details").filter({ hasText: "Does this create a downloadable 3D model?" }).locator("summary").click();
  await expect(page.getByText("Downloaded results are images intended for visualization and communication.", { exact: false })).toBeVisible();

  for (const path of ["/floor-plan-generator", "/interior-design-ai", "/ai-home-exterior-design-free"]) {
    await page.goto(path);
    await expect(page.getByText(/New accounts receive 3 signup credits/).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Compare credit pricing/i })).toBeVisible();
  }
});
