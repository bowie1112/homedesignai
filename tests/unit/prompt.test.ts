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
    const prompt = buildGenerationPrompt({ tool: "interior-design-ai", tier: "pro", prompt: "Make the room quieter and brighter.", inputAssetIds: ["675cc2b0-1ef4-46b5-8377-310dea391f9d"], roomType: "Bedroom", style: "Japandi", aspectRatio: "16:9" });
    expect(prompt).toContain("image-to-image transformation");
    expect(prompt).toContain("perspective room photograph");
    expect(prompt).toContain("preserve its exact camera position");
    expect(prompt).toContain("floor plan, architectural drawing, or top-down sketch");
    expect(prompt).toContain("furnished top-down 3D floor-plan rendering");
    expect(prompt).toContain("Never turn a top-down reference into an eye-level room photograph");
    expect(prompt).toContain("Design direction: Japandi");
  });

  it("keeps floor plan to 3D output image-only", () => {
    const prompt = buildGenerationPrompt({ tool: "floor-plan-to-3d", tier: "pro", prompt: "Create a furnished dollhouse view with warm oak.", inputAssetIds: ["675cc2b0-1ef4-46b5-8377-310dea391f9d"], roomType: "Apartment", style: "Contemporary", aspectRatio: "4:3" });
    expect(prompt).toContain("authoritative source for spatial structure");
    expect(prompt).toContain("one-to-one top-down 3D rendering");
    expect(prompt).toContain("every room boundary, wall, door, window, opening, and circulation path");
    expect(prompt).toContain("top-down orthographic or near-orthographic view");
    expect(prompt).toContain("do not redesign the layout or produce an eye-level perspective");
  });

  it("keeps the first image authoritative when multiple references are uploaded", () => {
    const prompt = buildGenerationPrompt({
      tool: "interior-design-ai",
      tier: "basic",
      prompt: "Use the material palette from the style references.",
      inputAssetIds: [
        "675cc2b0-1ef4-46b5-8377-310dea391f9d",
        "0657a46b-a3f2-4e75-9173-e85ed08c3c29",
      ],
      roomType: "Living room",
      style: "Warm minimal",
      aspectRatio: "4:3",
    });
    expect(prompt).toContain("first uploaded image as the authoritative source");
    expect(prompt).toContain("additional uploaded images only as secondary references");
    expect(prompt).toContain("must not override the first image's layout or viewpoint");
  });

  it("does not claim image-to-image behavior without a reference image", () => {
    const prompt = buildGenerationPrompt({ tool: "floor-plan-generator", tier: "basic", prompt: "Create a compact two-bedroom apartment.", inputAssetIds: [], roomType: "Apartment", style: "Warm minimal", aspectRatio: "4:3" });
    expect(prompt).not.toContain("image-to-image transformation");
  });
});
