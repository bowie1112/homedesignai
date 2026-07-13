import type { LucideIcon } from "lucide-react";
import {
  Armchair,
  Bath,
  BedDouble,
  Building2,
  ChefHat,
  Cuboid,
  DraftingCompass,
  Flower2,
  House,
  ImageUpscale,
  Layers3,
  PencilRuler,
  ScanLine,
  Sofa,
  Sparkles,
  Store,
  Trees,
  WandSparkles,
} from "lucide-react";

export const SITE_NAME = "Home Design AI";
export const SITE_DESCRIPTION =
  "Create thoughtful floor plans, room concepts, exterior ideas, and staged interiors with AI.";

export type ToolKey =
  | "floor-plan-generator"
  | "floor-plan-editor"
  | "floor-plan-designer"
  | "floor-plan-visualizer"
  | "sketch-to-floor-plan"
  | "floor-plan-to-3d"
  | "interior-design-ai"
  | "virtual-staging-ai"
  | "ai-home-exterior-design-free"
  | "ai-garden-design-free"
  | "ai-landscape-design"
  | "sketch-to-image";

export type ToolDefinition = {
  key: ToolKey;
  href: `/${ToolKey}`;
  title: string;
  navLabel: string;
  eyebrow: string;
  description: string;
  promptPlaceholder: string;
  inputMode: "text" | "image" | "both";
  resultKind: "floor-plan" | "interior" | "exterior";
  icon: LucideIcon;
  examples: string[];
};

export const tools: ToolDefinition[] = [
  {
    key: "floor-plan-generator",
    href: "/floor-plan-generator",
    title: "AI Floor Plan Generator",
    navLabel: "Floor Plan Generator",
    eyebrow: "Plan from a brief",
    description:
      "Describe the spaces you need and turn a short brief into a clear, furnished floor plan concept.",
    promptPlaceholder:
      "A two-bedroom apartment with an open kitchen, one shared bath, generous storage, and a south-facing balcony…",
    inputMode: "text",
    resultKind: "floor-plan",
    icon: DraftingCompass,
    examples: ["Compact apartment", "Family home", "Small café"],
  },
  {
    key: "floor-plan-editor",
    href: "/floor-plan-editor",
    title: "AI Floor Plan Editor",
    navLabel: "Floor Plan Editor",
    eyebrow: "Revise an existing plan",
    description:
      "Upload a floor plan, explain the change, and explore an edited layout while preserving the original structure.",
    promptPlaceholder:
      "Keep the exterior walls. Open the kitchen to the living room and turn the box room into a home office…",
    inputMode: "image",
    resultKind: "floor-plan",
    icon: PencilRuler,
    examples: ["Open the kitchen", "Add a bathroom", "Create a home office"],
  },
  {
    key: "floor-plan-designer",
    href: "/floor-plan-designer",
    title: "Floor Plan Designer",
    navLabel: "Floor Plan Designer",
    eyebrow: "Shape a spatial direction",
    description:
      "Build a design-ready plan concept around circulation, daylight, room adjacencies, and the way you live.",
    promptPlaceholder:
      "Design a quiet three-bedroom plan with a central social space and a private primary suite…",
    inputMode: "both",
    resultKind: "floor-plan",
    icon: Layers3,
    examples: ["Courtyard layout", "Split bedrooms", "Open-plan living"],
  },
  {
    key: "floor-plan-visualizer",
    href: "/floor-plan-visualizer",
    title: "Floor Plan Visualizer",
    navLabel: "Floor Plan Visualizer",
    eyebrow: "Make plans easier to read",
    description:
      "Transform a flat plan into a warm, furnished visualization that communicates scale and room relationships.",
    promptPlaceholder:
      "Visualize this plan with pale oak floors, warm neutral furniture, and soft natural daylight…",
    inputMode: "image",
    resultKind: "floor-plan",
    icon: ImageUpscale,
    examples: ["Warm minimal", "Soft contemporary", "Natural materials"],
  },
  {
    key: "sketch-to-floor-plan",
    href: "/sketch-to-floor-plan",
    title: "Sketch to Floor Plan",
    navLabel: "Sketch to Floor Plan",
    eyebrow: "From rough lines to a plan",
    description:
      "Turn a hand-drawn room sketch into a polished floor plan while preserving its overall arrangement.",
    promptPlaceholder:
      "Clean up this sketch into a two-dimensional architectural plan with clear walls, doors, and furniture…",
    inputMode: "image",
    resultKind: "floor-plan",
    icon: ScanLine,
    examples: ["Clean line plan", "Furnished 2D", "2.5D presentation"],
  },
  {
    key: "floor-plan-to-3d",
    href: "/floor-plan-to-3d",
    title: "Floor Plan to 3D Render",
    navLabel: "Floor Plan to 3D",
    eyebrow: "A 3D-style image preview",
    description:
      "Create a 3D-style presentation image from a floor plan. This is a rendered image, not an editable 3D model.",
    promptPlaceholder:
      "Create a top-down 3D-style render with warm oak, cream upholstery, and accurate room boundaries…",
    inputMode: "image",
    resultKind: "floor-plan",
    icon: Cuboid,
    examples: ["Top-down 3D", "Dollhouse view", "Material study"],
  },
  {
    key: "interior-design-ai",
    href: "/interior-design-ai",
    title: "AI Interior Design",
    navLabel: "Interior Design",
    eyebrow: "Redesign a room in context",
    description:
      "Upload a room and explore a new interior direction while keeping the architecture and camera angle intact.",
    promptPlaceholder:
      "Redesign this living room with an editorial contemporary look, natural oak, limestone, and linen…",
    inputMode: "image",
    resultKind: "interior",
    icon: Armchair,
    examples: ["Quiet luxury", "Japandi", "Mid-century"],
  },
  {
    key: "virtual-staging-ai",
    href: "/virtual-staging-ai",
    title: "AI Virtual Staging",
    navLabel: "Virtual Staging",
    eyebrow: "Furnish an empty room",
    description:
      "Stage vacant property photography with coherent furniture, realistic scale, and believable lighting.",
    promptPlaceholder:
      "Stage this empty room as a calm living and dining space for a young family, preserving all windows and walls…",
    inputMode: "image",
    resultKind: "interior",
    icon: Sofa,
    examples: ["Living room", "Primary bedroom", "Dining room"],
  },
  {
    key: "ai-home-exterior-design-free",
    href: "/ai-home-exterior-design-free",
    title: "AI Home Exterior Design",
    navLabel: "Exterior Design",
    eyebrow: "Reimagine the street view",
    description:
      "Explore buildable facade, material, color, and planting ideas while retaining the shape of your home.",
    promptPlaceholder:
      "Update this facade with pale mineral stucco, warm timber, slate window frames, and simple native planting…",
    inputMode: "image",
    resultKind: "exterior",
    icon: House,
    examples: ["Modern refresh", "Coastal", "Craftsman"],
  },
  {
    key: "ai-garden-design-free",
    href: "/ai-garden-design-free",
    title: "AI Garden Design",
    navLabel: "Garden Design",
    eyebrow: "Design an outdoor room",
    description:
      "Generate garden concepts around your space, climate, desired maintenance level, and way of entertaining.",
    promptPlaceholder:
      "Create a low-maintenance city garden with layered grasses, a small dining terrace, and privacy planting…",
    inputMode: "image",
    resultKind: "exterior",
    icon: Flower2,
    examples: ["Small courtyard", "Family garden", "Low maintenance"],
  },
  {
    key: "ai-landscape-design",
    href: "/ai-landscape-design",
    title: "AI Landscape Design",
    navLabel: "Landscape Design",
    eyebrow: "Plan the larger landscape",
    description:
      "Visualize coherent paths, planting zones, outdoor uses, and material choices across a larger site.",
    promptPlaceholder:
      "Create a restrained landscape plan with a looping path, drought-tolerant planting, and a shaded seating area…",
    inputMode: "both",
    resultKind: "exterior",
    icon: Trees,
    examples: ["Residential site", "Hospitality", "Courtyard sequence"],
  },
  {
    key: "sketch-to-image",
    href: "/sketch-to-image",
    title: "Architectural Sketch to Image",
    navLabel: "Sketch to Image",
    eyebrow: "Render an early idea",
    description:
      "Turn a loose interior or exterior sketch into a realistic concept image without losing its composition.",
    promptPlaceholder:
      "Render this sketch as a believable contemporary interior, keeping the perspective, openings, and furniture layout…",
    inputMode: "image",
    resultKind: "interior",
    icon: WandSparkles,
    examples: ["Photoreal", "Material study", "Soft daylight"],
  },
];

export const toolMap = new Map(tools.map((tool) => [tool.key, tool]));

export const roomPages = [
  { slug: "office-floor-plan", title: "Office Floor Plan Generator", room: "Office", icon: Building2 },
  { slug: "kitchen-floor-plan", title: "Kitchen Floor Plan Generator", room: "Kitchen", icon: ChefHat },
  { slug: "restaurant-floor-plan", title: "Restaurant Floor Plan Generator", room: "Restaurant", icon: Store },
  { slug: "apartment-floor-plan", title: "Apartment Floor Plan Generator", room: "Apartment", icon: Building2 },
  { slug: "bedroom-floor-plan", title: "Bedroom Floor Plan Generator", room: "Bedroom", icon: BedDouble },
  { slug: "bathroom-floor-plan", title: "Bathroom Floor Plan Generator", room: "Bathroom", icon: Bath },
  { slug: "living-room-floor-plan", title: "Living Room Floor Plan Generator", room: "Living room", icon: Sofa },
] as const;

export const ideaPages = [
  { slug: "small-living-room-ideas", title: "Small Living Room Ideas", summary: "Make a compact living room feel calm, useful, and generous." },
  { slug: "modern-bedroom-ideas", title: "Modern Bedroom Ideas", summary: "Build a restful bedroom around proportion, lighting, and touch." },
  { slug: "kitchen-layout-ideas", title: "Kitchen Layout Ideas", summary: "Compare practical kitchen arrangements before committing to cabinetry." },
  { slug: "small-bathroom-ideas", title: "Small Bathroom Ideas", summary: "Use every centimeter without making the room feel overdesigned." },
  { slug: "home-office-ideas", title: "Home Office Ideas", summary: "Create a focused workspace that belongs in the home." },
  { slug: "front-yard-landscaping-ideas", title: "Front Yard Landscaping Ideas", summary: "Shape a welcoming approach with restrained planting and clear paths." },
  { slug: "apartment-design-ideas", title: "Apartment Design Ideas", summary: "Give smaller homes identity through storage, zoning, and material continuity." },
] as const;

export const converterPages = [
  { slug: "cm-to-feet", title: "Centimeters to Feet", from: "cm", to: "ft", factor: 0.0328084 },
  { slug: "feet-to-cm", title: "Feet to Centimeters", from: "ft", to: "cm", factor: 30.48 },
  { slug: "inches-to-cm", title: "Inches to Centimeters", from: "in", to: "cm", factor: 2.54 },
] as const;

export const roomTypes = [
  "Living room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Dining room",
  "Home office",
  "Entryway",
  "Studio",
  "Kids room",
  "Retail space",
  "Restaurant",
  "Hotel room",
];

export const designStyles = [
  "Warm minimal",
  "Contemporary",
  "Japandi",
  "Mid-century modern",
  "Scandinavian",
  "Mediterranean",
  "Industrial",
  "Coastal",
  "Traditional",
  "Art deco",
];

export const aspectRatios = [
  "1:1",
  "1:4",
  "1:8",
  "2:3",
  "3:2",
  "3:4",
  "4:1",
  "4:3",
  "4:5",
  "5:4",
  "8:1",
  "9:16",
  "16:9",
  "21:9",
  "auto",
] as const;

export const navGroups = [
  {
    label: "Floor plans",
    items: tools.slice(0, 6).map(({ navLabel, href, description }) => ({ label: navLabel, href, description })),
  },
  {
    label: "Home design",
    items: tools.slice(6).map(({ navLabel, href, description }) => ({ label: navLabel, href, description })),
  },
];

export const featureStats = [
  { label: "Model tiers", value: "2" },
  { label: "Design tools", value: "12" },
  { label: "Signup credits", value: "3" },
];

export const homeHighlights = [
  {
    number: "01",
    title: "Plan before you render",
    text: "Start with adjacencies, circulation, and constraints—not decoration. The result is a concept you can discuss with real clarity.",
  },
  {
    number: "02",
    title: "Keep structure in view",
    text: "Editing tools prompt the model to preserve windows, walls, camera position, and room boundaries when those details matter.",
  },
  {
    number: "03",
    title: "Move from plan to atmosphere",
    text: "Use the same workspace for floor-plan concepts, furnished visualizations, interior directions, and exterior studies.",
  },
];

export const faqs = [
  {
    question: "Is Home Design AI a replacement for an architect?",
    answer:
      "No. It is a fast concept and communication tool. Building, planning, safety, accessibility, and permit decisions should always be reviewed by qualified local professionals.",
  },
  {
    question: "What is the difference between Basic and Pro?",
    answer:
      "Basic uses Nano Banana 2 Lite and costs 1 credit. Pro uses Nano Banana 2 at a fixed 2K output and costs 3 credits. Pro is the better choice for final presentation images.",
  },
  {
    question: "Do credits expire?",
    answer:
      "No. Signup, subscription, and credit-pack balances accumulate and remain available until you use them.",
  },
  {
    question: "Can I create an editable 3D model?",
    answer:
      "Not in this release. Floor Plan to 3D creates a 3D-style image render. We do not present it as a native or editable 3D file.",
  },
  {
    question: "Are my uploaded rooms public?",
    answer:
      "No. Uploaded assets are stored privately and accessed with short-lived signed links during generation.",
  },
];

export const brandIcon = Sparkles;
