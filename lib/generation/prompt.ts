import type { GenerationInput } from "@/lib/generation/types";

const structuralRules: Record<string, string> = {
  "floor-plan-generator": "Create a coherent architectural floor plan with believable circulation, wall thicknesses, openings, and furniture scale.",
  "floor-plan-editor": "Preserve exterior walls, overall footprint, orientation, and every element not explicitly requested to change.",
  "floor-plan-designer": "Prioritize useful adjacencies, daylight, privacy, circulation, storage, and realistic furniture clearances.",
  "floor-plan-visualizer": "Preserve the uploaded plan geometry exactly while improving furnishing, material legibility, and presentation quality.",
  "sketch-to-floor-plan": "Preserve the sketch layout, proportions, openings, and room relationships. Clean the drawing without inventing new rooms.",
  "floor-plan-to-3d": "Create a one-to-one top-down 3D rendering of the primary reference plan. Preserve the complete exterior footprint, orientation, crop, room count, every room boundary, wall, door, window, opening, and circulation path. Keep the entire plan visible in a top-down orthographic or near-orthographic view. Add only realistically scaled furniture, materials, lighting, and modest wall height; do not redesign the layout or produce an eye-level perspective, native 3D model, or CAD drawing.",
  "interior-design-ai": "First classify the primary reference image by viewpoint. If it is a perspective room photograph, preserve its exact camera position, framing, perspective, walls, windows, doors, ceiling height, and room geometry; change furnishings, finishes, lighting, and decor only. If it is a floor plan, architectural drawing, or top-down sketch, preserve its complete footprint, orientation, crop, room count, boundaries, walls, doors, windows, openings, and room relationships, then create a furnished top-down 3D floor-plan rendering of that same layout. Never turn a top-down reference into an eye-level room photograph or an isolated single-room scene.",
  "virtual-staging-ai": "Preserve architecture and camera position. Add realistically scaled furniture with coherent perspective, contact shadows, and lighting.",
  "ai-home-exterior-design-free": "Preserve building massing, roofline, windows, doors, camera position, and neighboring context. Change facade finishes and planting only.",
  "ai-garden-design-free": "Preserve property boundaries and fixed structures. Add buildable paths, planting, and outdoor-use zones at believable scale.",
  "ai-landscape-design": "Preserve site geometry and fixed context. Create coherent grading, circulation, planting zones, and outdoor uses.",
  "sketch-to-image": "Preserve the sketch composition, perspective, proportions, and openings. Render materials and light without adding unrelated elements.",
};

function referenceRules(input: GenerationInput) {
  if (input.inputAssetIds.length === 0) return null;

  return [
    "This is an image-to-image transformation, not an unrelated text-to-image composition.",
    "Treat the first uploaded image as the authoritative source for spatial structure, composition, viewpoint, framing, orientation, exterior footprint, room count, walls, doors, windows, openings, and major proportions. Preserve those visible facts unless the user explicitly requests a specific edit.",
    "Keep the source viewpoint: a top-down source must remain top-down, and a perspective source must retain its camera position and perspective. Do not replace the source with a different building, layout, room, or unrelated scene.",
    input.inputAssetIds.length > 1
      ? "Use additional uploaded images only as secondary references for style, materials, colors, furnishings, and details; they must not override the first image's layout or viewpoint."
      : null,
  ].filter(Boolean).join(" ");
}

function outputRule(input: GenerationInput) {
  if (input.tool === "interior-design-ai") {
    return "For a perspective room photo, use believable materials, physically coherent light, and editorial architectural photography. For a floor plan or top-down drawing, use a polished furnished top-down 3D architectural rendering. No text, logos, or watermarks.";
  }
  if (input.tool.includes("floor-plan") || input.tool === "sketch-to-floor-plan") {
    return "Use a clean architectural presentation. No labels, dimensions, logos, watermarks, or people unless requested.";
  }
  return "Use believable materials, physically coherent light, and editorial architectural photography. No text, logos, or watermarks.";
}

export function buildGenerationPrompt(input: GenerationInput) {
  return [
    `User brief: ${input.prompt}`,
    `Space type: ${input.roomType}.`,
    `Design direction: ${input.style}.`,
    referenceRules(input),
    structuralRules[input.tool],
    outputRule(input),
    "The result is an early design concept. Avoid unsafe, impossible, or structurally implausible geometry.",
  ].filter(Boolean).join("\n\n");
}
