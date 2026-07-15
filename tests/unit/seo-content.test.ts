import { describe, expect, it } from "vitest";
import { toolMap, tools } from "@/lib/site";

function searchableCopy() {
  const tool = toolMap.get("floor-plan-to-3d");
  if (!tool) throw new Error("Missing floor-plan-to-3d tool definition");
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
  it("assigns a complete metadata and content contract to the rendering page", () => {
    const tool = toolMap.get("floor-plan-to-3d");
    expect(tool?.title).toBe("Floor Plan to 3D Rendering");
    expect(tool?.metaTitle).toBe("Floor Plan to 3D Rendering Tool | Home Design AI");
    expect(tool?.metaDescription?.length).toBeGreaterThan(100);
    expect(tool?.intentSections).toHaveLength(2);
    expect(tool?.commercialQuestions).toHaveLength(3);
    expect(tool?.faqs).toHaveLength(4);
    expect(tool?.relatedLinks).toHaveLength(3);
  });

  it("covers the selected rendering and conversion intent", () => {
    const copy = searchableCopy();
    for (const keyword of [
      "floor plan to 3d",
      "3d floor plan rendering",
      "floor plan rendering",
      "floorplan render",
      "convert a 2d floor plan to 3d",
    ]) {
      expect(copy).toContain(keyword);
    }
  });

  it("states the credit and image-only limits without targeting model generators", () => {
    const copy = searchableCopy();
    expect(copy).toContain("3 signup credits");
    expect(copy).toContain("basic generation costs 1 credit");
    expect(copy).toContain("pro 2k generation costs 3 credits");
    expect(copy).toContain("does not create an editable 3d model");
    expect(copy).toContain("rendered image rather than a model file");
    expect(copy).not.toMatch(/ai 3d model generator|image to 3d model|text to 3d model|3d asset|3d model service|3d model company/i);
    expect(copy).not.toMatch(/no login required|free forever|unlimited free generations|exports? an editable 3d|cad export included/i);
  });

  it("leaves the other tool pages on the shared default content contract", () => {
    for (const tool of tools.filter(({ key }) => key !== "floor-plan-to-3d")) {
      expect(tool.metaTitle).toBeUndefined();
      expect(tool.intentSections).toBeUndefined();
      expect(tool.commercialQuestions).toBeUndefined();
      expect(tool.faqs).toBeUndefined();
      expect(tool.relatedLinks).toBeUndefined();
    }
  });
});
