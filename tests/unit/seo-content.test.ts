import { describe, expect, it } from "vitest";
import { toolMap, tools, type ToolKey } from "@/lib/site";

const seoTargets: { key: ToolKey; primaryKeyword: string }[] = [
  { key: "floor-plan-to-3d", primaryKeyword: "floor plan to 3d" },
  { key: "floor-plan-generator", primaryKeyword: "ai floor plan generator" },
  { key: "interior-design-ai", primaryKeyword: "ai room design" },
  { key: "ai-home-exterior-design-free", primaryKeyword: "ai home exterior design" },
];

function searchableCopy(key: ToolKey) {
  const tool = toolMap.get(key);
  if (!tool) throw new Error(`Missing tool definition for ${key}`);
  return JSON.stringify({
    title: tool.title,
    metaTitle: tool.metaTitle,
    metaDescription: tool.metaDescription,
    intentSections: tool.intentSections,
    commercialQuestions: tool.commercialQuestions,
    faqs: tool.faqs,
    relatedLinks: tool.relatedLinks,
  }).toLowerCase();
}

describe("priority landing-page SEO content", () => {
  it("assigns complete and unique metadata to the four enhanced tool pages", () => {
    const enhanced = seoTargets.map(({ key }) => toolMap.get(key));
    expect(enhanced.every(Boolean)).toBe(true);

    const titles = enhanced.map((tool) => tool?.metaTitle);
    const descriptions = enhanced.map((tool) => tool?.metaDescription);
    expect(new Set(titles).size).toBe(enhanced.length);
    expect(new Set(descriptions).size).toBe(enhanced.length);

    for (const tool of enhanced) {
      expect(tool?.metaTitle).toMatch(/Home Design AI$/);
      expect(tool?.metaDescription?.length).toBeGreaterThan(100);
      expect(tool?.intentSections).toHaveLength(2);
      expect(tool?.commercialQuestions).toHaveLength(3);
      expect(tool?.faqs).toHaveLength(4);
      expect(tool?.relatedLinks).toHaveLength(3);
    }
  });

  it("keeps each primary keyword in its assigned page content", () => {
    for (const target of seoTargets) {
      expect(searchableCopy(target.key)).toContain(target.primaryKeyword);
    }
  });

  it("states the credit and rendering limits without unsupported promises", () => {
    const enhancedCopy = seoTargets.map(({ key }) => searchableCopy(key)).join(" ");
    expect(enhancedCopy).not.toMatch(/no login required|free forever|unlimited free generations|exports? an editable 3d|cad export included/i);

    const floorPlanTo3dCopy = searchableCopy("floor-plan-to-3d");
    expect(floorPlanTo3dCopy).toContain("does not create an editable 3d model");
    expect(floorPlanTo3dCopy).toContain("rendered image rather than a model file");

    for (const key of ["floor-plan-generator", "interior-design-ai", "ai-home-exterior-design-free"] as ToolKey[]) {
      const copy = searchableCopy(key);
      expect(copy).toContain("3 signup credits");
      expect(copy).toContain("basic");
      expect(copy).toContain("pro 2k");
    }
  });

  it("leaves the other tool pages on the shared default content contract", () => {
    const enhancedKeys = new Set(seoTargets.map(({ key }) => key));
    for (const tool of tools.filter(({ key }) => !enhancedKeys.has(key))) {
      expect(tool.metaTitle).toBeUndefined();
      expect(tool.intentSections).toBeUndefined();
    }
  });
});
