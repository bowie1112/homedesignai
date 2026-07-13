import { describe, expect, it } from "vitest";
import { buildGenerationPrompt } from "@/lib/generation/prompt";

describe("tool prompt builders", () => {
  it("injects floor-plan structural constraints", () => {
    const prompt = buildGenerationPrompt({ tool: "floor-plan-editor", tier: "basic", prompt: "Open the kitchen and add an island.", inputAssetIds: [], roomType: "Apartment", style: "Warm minimal", aspectRatio: "4:3" });
    expect(prompt).toContain("Preserve exterior walls");
    expect(prompt).toContain("Space type: Apartment");
    expect(prompt).toContain("No labels, dimensions, logos, watermarks");
  });

  it("injects camera and architecture preservation for room redesign", () => {
    const prompt = buildGenerationPrompt({ tool: "interior-design-ai", tier: "pro", prompt: "Make the room quieter and brighter.", inputAssetIds: [], roomType: "Bedroom", style: "Japandi", aspectRatio: "16:9" });
    expect(prompt).toContain("Preserve camera position, walls, windows, doors");
    expect(prompt).toContain("Design direction: Japandi");
  });
});
