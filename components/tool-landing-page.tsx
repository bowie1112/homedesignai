import { Check, MoveRight, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GeneratorWorkbench } from "@/components/generator-workbench";
import type { ToolDefinition } from "@/lib/site";

function exampleImage(tool: ToolDefinition) {
  if (tool.resultKind === "floor-plan") return "/images/floor-plan-2-5d.webp";
  if (tool.resultKind === "exterior") return "/images/exterior-concept.webp";
  return "/images/hero-interior.webp";
}

const useCases = {
  "floor-plan": ["Early layout studies", "Client-ready concept images", "Room adjacency exploration"],
  interior: ["Room redesign concepts", "Property marketing", "Material and style studies"],
  exterior: ["Facade direction", "Garden and landscape ideas", "Material and planting studies"],
};

export function ToolLandingPage({ tool }: { tool: ToolDefinition }) {
  const Icon = tool.icon;
  const isRender = tool.key === "floor-plan-to-3d";

  return (
    <main id="main-content">
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="blueprint-grid absolute inset-0 opacity-55" />
        <div className="site-shell relative grid min-h-[560px] items-center gap-12 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
          <div>
            <span className="eyebrow">{tool.eyebrow}</span>
            <h1 className="display-title mt-7 max-w-[12ch] text-[clamp(3rem,6vw,5.8rem)]">{tool.title}</h1>
            <p className="lede mt-7">{tool.description}</p>
            {isRender ? (
              <div className="mt-6 border-l-2 border-[var(--blue)] bg-[var(--blue-pale)] p-4 text-sm leading-6">
                This tool creates a 3D-style image. It does not export an editable 3D model or CAD file.
              </div>
            ) : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a className="button-primary" href="#generator">Create a design <MoveRight size={16} /></a>
              <Link className="button-secondary" href="/pricing">View credit pricing</Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-[var(--ink-soft)]">
              <span className="flex items-center gap-2"><Check className="text-[var(--green)]" size={15} /> 3 credits at signup</span>
              <span className="flex items-center gap-2"><ShieldCheck className="text-[var(--blue)]" size={15} /> Private uploads</span>
              <span className="flex items-center gap-2"><WandSparkles className="text-[var(--blue)]" size={15} /> Basic and Pro</span>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden border border-[var(--line)] bg-[var(--white)] shadow-[var(--shadow-lg)]">
            <Image alt={`Original example created for ${tool.title}`} className="object-cover" fill priority sizes="(max-width: 1024px) 100vw, 54vw" src={exampleImage(tool)} />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-[color:oklch(22%_0.035_257/0.9)] px-4 py-3 text-xs text-white backdrop-blur">
              <span>Editorial example</span><span className="font-bold uppercase tracking-[0.1em]">Original visual</span>
            </div>
          </div>
        </div>
      </section>

      <section className="site-shell py-16 sm:py-24" id="generator">
        <GeneratorWorkbench defaultTool={tool.key} />
      </section>

      <section className="content-auto border-y border-[var(--line)] bg-[var(--white)] py-20 sm:py-28">
        <div className="site-shell grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="eyebrow">Designed for useful iteration</span>
            <h2 className="section-title mt-5">A focused brief produces a more useful concept.</h2>
          </div>
          <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
            {[
              { title: "Add the evidence", text: tool.inputMode === "text" ? "Describe the spaces, relationships, and constraints that matter." : "Upload a clear, well-lit image or readable plan without cropped edges." },
              { title: "Name the change", text: "Say what should change and, just as importantly, what must stay the same." },
              { title: "Choose the fidelity", text: "Use Basic for fast exploration and Pro 2K for a presentation-ready direction." },
            ].map((item, index) => (
              <article className="min-h-[270px] bg-[var(--paper)] p-6" key={item.title}>
                <span className="text-xs font-bold text-[var(--blue)]">0{index + 1}</span>
                <h3 className="mt-16 text-xl font-semibold tracking-[-0.035em]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-auto site-shell py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="relative aspect-[16/10] overflow-hidden border border-[var(--line)]">
            <Image alt={`${tool.title} design direction`} className="object-cover" fill sizes="(max-width: 1024px) 100vw, 55vw" src={exampleImage(tool)} />
          </div>
          <div>
            <Icon className="text-[var(--blue)]" size={30} strokeWidth={1.5} />
            <h2 className="section-title mt-6">Built for the decisions between an idea and a drawing set.</h2>
            <ul className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {useCases[tool.resultKind].map((item) => (
                <li className="flex min-h-14 items-center gap-3 text-sm font-semibold" key={item}><Sparkles className="text-[var(--blue)]" size={15} /> {item}</li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-6 text-[var(--ink-soft)]">AI outputs are concept images. Verify dimensions, structure, accessibility, materials, and local code requirements with qualified professionals before building.</p>
          </div>
        </div>
      </section>

      <section className="bg-[var(--blue)] py-16 text-white sm:py-20">
        <div className="site-shell flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
          <div><span className="text-xs font-bold uppercase tracking-[0.12em] text-[color:oklch(88%_0.05_258)]">Keep the idea moving</span><h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Create your first {tool.navLabel.toLowerCase()} concept.</h2></div>
          <a className="button-secondary shrink-0 border-white bg-white text-[var(--blue-deep)]" href="#generator">Open the workspace <MoveRight size={16} /></a>
        </div>
      </section>
    </main>
  );
}
