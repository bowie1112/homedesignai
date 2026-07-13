import type { GenerationInput } from "@/lib/generation/types";

const structuralRules: Record<string, string> = {
  "floor-plan-generator": "Create a coherent architectural floor plan with believable circulation, wall thicknesses, openings, and furniture scale.",
  "floor-plan-editor": "Preserve exterior walls, overall footprint, orientation, and every element not explicitly requested to change.",
  "floor-plan-designer": "Prioritize useful adjacencies, daylight, privacy, circulation, storage, and realistic furniture clearances.",
  "floor-plan-visualizer": "Preserve the uploaded plan geometry exactly while improving furnishing, material legibility, and presentation quality.",
  "sketch-to-floor-plan": "Preserve the sketch layout, proportions, openings, and room relationships. Clean the drawing without inventing new rooms.",
  "floor-plan-to-3d": "Preserve every room boundary and opening. Produce a top-down 3D-style image render, not a native 3D model or CAD drawing.",
  "interior-design-ai": "Preserve camera position, walls, windows, doors, ceiling height, and room geometry. Change furnishings, finishes, lighting, and decor only.",
  "virtual-staging-ai": "Preserve architecture and camera position. Add realistically scaled furniture with coherent perspective, contact shadows, and lighting.",
  "ai-home-exterior-design-free": "Preserve building massing, roofline, windows, doors, camera position, and neighboring context. Change facade finishes and planting only.",
  "ai-garden-design-free": "Preserve property boundaries and fixed structures. Add buildable paths, planting, and outdoor-use zones at believable scale.",
  "ai-landscape-design": "Preserve site geometry and fixed context. Create coherent grading, circulation, planting zones, and outdoor uses.",
  "sketch-to-image": "Preserve the sketch composition, perspective, proportions, and openings. Render materials and light without adding unrelated elements.",
};

export function buildGenerationPrompt(input: GenerationInput) {
  const output = input.tool.includes("floor-plan") || input.tool === "sketch-to-floor-plan" ? "Use a clean architectural presentation. No labels, dimensions, logos, watermarks, or people unless requested." : "Use believable materials, physically coherent light, and editorial architectural photography. No text, logos, or watermarks.";
  return [
    `User brief: ${input.prompt}`,
    `Space type: ${input.roomType}.`,
    `Design direction: ${input.style}.`,
    structuralRules[input.tool],
    output,
    "The result is an early design concept. Avoid unsafe, impossible, or structurally implausible geometry.",
  ].join("\n\n");
}
