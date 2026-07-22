import type { Metadata } from "next";
import {
  ArrowDown,
  ArrowUpRight,
  MoveRight,
  MousePointer2,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GeneratorWorkbench } from "@/components/generator-workbench";
import { PricingSection } from "@/components/pricing-section";
import { getAppUrl } from "@/lib/env";
import { faqs, featureStats, homeDesignTools, homeHighlights, homepageTools, SITE_DESCRIPTION } from "@/lib/site";

const homeUrl = `${getAppUrl()}/`;

export const metadata: Metadata = {
  title: { absolute: "AI Home Design — Interior, Exterior & Room Design | Home Design AI" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: homeUrl },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Home Design AI",
    url: homeUrl,
    description: SITE_DESCRIPTION,
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    featureList: [
      "AI interior design",
      "AI virtual staging",
      "AI home exterior design",
      "AI garden design",
      "AI floor plan tools",
    ],
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <main id="main-content">
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} type="application/ld+json" />
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="blueprint-grid absolute inset-0 opacity-50" />
        <div className="site-shell relative grid min-h-[730px] items-stretch lg:grid-cols-[0.92fr_1.08fr]">
          <div className="flex flex-col justify-center py-20 pr-0 lg:py-24 lg:pr-14">
            <div className="reveal-up" style={{ "--i": 0 } as React.CSSProperties}>
              <span className="eyebrow">AI home design for real spaces</span>
            </div>
            <h1 className="display-title reveal-up mt-7" style={{ "--i": 1 } as React.CSSProperties}>
              AI Home Design for Every Room
            </h1>
            <p className="lede reveal-up mt-8 max-w-[57ch]" style={{ "--i": 2 } as React.CSSProperties}>
              Upload a room or home photo to explore AI interior design, virtual staging, exterior updates, and garden ideas before you renovate.
            </p>
            <div className="reveal-up mt-9 flex flex-col gap-3 sm:flex-row" style={{ "--i": 3 } as React.CSSProperties}>
              <Link className="button-primary" href="#create">
                Start your home design <MoveRight size={17} />
              </Link>
              <Link className="button-secondary" href="/interior-design-ai">
                Explore AI interior design
              </Link>
            </div>
            <div className="reveal-up mt-11 grid grid-cols-3 gap-px border-y border-[var(--line)] bg-[var(--line)]" style={{ "--i": 4 } as React.CSSProperties}>
              {featureStats.map((stat) => (
                <div className="bg-[var(--paper)] py-4 pr-3" key={stat.label}>
                  <div className="text-xl font-semibold tabular-nums tracking-[-0.04em]">{stat.value}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.09em] text-[var(--ink-soft)]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative min-h-[500px] border-x border-t border-[var(--line)] lg:min-h-0 lg:border-b-0 lg:border-r">
            <Image
              alt="Original contemporary living room with cream seating, pale oak cabinetry, and a cobalt lounge chair"
              className="object-cover"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              src="/images/hero-interior.webp"
            />
            <div className="absolute inset-x-4 bottom-4 grid gap-px bg-[color:oklch(99%_0.005_84/0.55)] p-px backdrop-blur-md sm:left-auto sm:w-[330px]">
              <div className="bg-[color:oklch(22%_0.035_257/0.92)] p-4 text-[var(--paper)]">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.12em]">
                  <span>Material note / 01</span><ArrowUpRight size={14} />
                </div>
                <p className="mt-5 text-sm leading-6 text-[color:oklch(91%_0.02_84)]">Pale oak, limestone, and one saturated blue element create structure without visual noise.</p>
              </div>
            </div>
          </div>
        </div>
        <a aria-label="Jump to generator" className="absolute bottom-5 left-1/2 hidden size-11 -translate-x-1/2 place-items-center border border-[var(--line)] bg-[var(--paper)] lg:grid" href="#create">
          <ArrowDown size={18} />
        </a>
      </section>

      <section className="site-shell py-20 sm:py-28" id="create">
        <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <span className="eyebrow">AI home design studio</span>
            <h2 className="section-title mt-5">Redesign interiors, stage rooms, or refresh your exterior.</h2>
          </div>
          <p className="lede lg:justify-self-end">Upload the space you want to change, describe your direction, and create a visual concept you can refine before making real-world decisions.</p>
        </div>
        <GeneratorWorkbench defaultTool="interior-design-ai" showTabs />
      </section>

      <section className="content-auto border-y border-[var(--line)] bg-[var(--white)] py-20 sm:py-28">
        <div className="site-shell">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <span className="eyebrow">Tools for the whole home</span>
              <h2 className="section-title mt-5">One home. More ways to see what comes next.</h2>
              <p className="lede mt-6">Move from AI room design to exterior, garden, landscape, and floor plan concepts without leaving the same private workspace.</p>
              <Link className="button-secondary mt-8" href="/interior-design-ai">Open AI interior design <MoveRight size={16} /></Link>
            </div>
            <div className="grid border-l border-t border-[var(--line)] sm:grid-cols-2">
              {homepageTools.map((tool, index) => {
                const Icon = tool.icon;
                return (
                  <Link
                    className={`group min-h-[230px] border-b border-r border-[var(--line)] p-6 transition-colors hover:bg-[var(--blue-pale)] ${index === 0 || index === homeDesignTools.length ? "sm:row-span-2 sm:min-h-[460px]" : ""}`}
                    href={tool.href}
                    key={tool.key}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold tabular-nums text-[var(--ink-soft)]">{String(index + 1).padStart(2, "0")}</span>
                      <Icon className="text-[var(--blue)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" size={22} strokeWidth={1.6} />
                    </div>
                    <h3 className="mt-12 max-w-[14ch] text-2xl font-semibold tracking-[-0.045em]">{tool.navLabel}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--ink-soft)]">{tool.description}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-[var(--blue-deep)]">Open tool <MoveRight size={14} /></span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="content-auto site-shell py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden border border-[var(--line)] bg-[var(--white)]">
            <Image alt="AI home exterior design concept with warm natural materials and considered landscaping" className="object-cover" fill sizes="(max-width: 1024px) 100vw, 50vw" src="/images/exterior-concept.webp" />
            <div className="absolute left-0 top-0 bg-[var(--blue)] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white">From interior to exterior</div>
          </div>
          <div>
            <span className="eyebrow">Whole-home design direction</span>
            <h2 className="section-title mt-5">See a new direction before you renovate.</h2>
            <div className="mt-9 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {homeHighlights.map((item) => (
                <div className="grid gap-4 py-6 sm:grid-cols-[48px_1fr]" key={item.number}>
                  <span className="text-xs font-bold text-[var(--blue)]">{item.number}</span>
                  <div><h3 className="text-lg font-semibold tracking-[-0.025em]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="content-auto border-y border-[var(--line)] bg-[var(--blue-pale)] py-20 sm:py-28">
        <div className="site-shell">
          <span className="eyebrow">Three simple steps</span>
          <div className="mt-6 grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
            <h2 className="section-title">Bring the problem. Leave with a visual direction.</h2>
            <div className="grid gap-px border border-[var(--line-strong)] bg-[var(--line-strong)] sm:grid-cols-3">
              {[
                { icon: UploadCloud, title: "Upload your space", text: "Add a room, home exterior, garden, sketch, or floor plan when the existing context matters." },
                { icon: MousePointer2, title: "Describe the change", text: "Choose the space, style, ratio, and the home design direction you want to explore." },
                { icon: Sparkles, title: "Visualize and refine", text: "Create a private concept, review it in your history, and iterate before you renovate." },
              ].map((step, index) => {
                const Icon = step.icon;
                return <article className="min-h-[280px] bg-[var(--paper)] p-6" key={step.title}><div className="flex items-center justify-between"><Icon className="text-[var(--blue)]" size={23} /><span className="text-xs font-bold">0{index + 1}</span></div><h3 className="mt-16 text-xl font-semibold tracking-[-0.035em]">{step.title}</h3><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{step.text}</p></article>;
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="content-auto site-shell py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div><span className="eyebrow">Common questions</span><h2 className="section-title mt-5">What the tool is—and what it is not.</h2></div>
          <div className="border-t border-[var(--line)]">
            {faqs.map((faq, index) => (
              <details className="group border-b border-[var(--line)]" key={faq.question} open={index === 0}>
                <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-5 text-base font-semibold tracking-[-0.02em]">
                  {faq.question}<span className="grid size-8 shrink-0 place-items-center border border-[var(--line)] text-[var(--blue)] transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="grid grid-rows-[1fr]"><p className="max-w-2xl pb-7 text-sm leading-6 text-[var(--ink-soft)]">{faq.answer}</p></div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      <section className="content-auto overflow-hidden border-t border-[var(--line)] bg-[var(--paper)] py-16 sm:py-20">
        <div className="site-shell grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div><span className="eyebrow">Ready to rethink your home?</span><h2 className="mt-4 max-w-[18ch] text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">Create your next home design from a photo.</h2></div>
          <Link className="button-primary" href="/interior-design-ai">Start with AI interior design <MoveRight size={17} /></Link>
        </div>
      </section>

      <section aria-label="Featured directories" className="border-t border-[var(--line)] bg-[var(--white)] py-8">
        <div className="site-shell flex flex-wrap items-center justify-center gap-5 sm:justify-start">
          <a
            href="https://theresanaiforthat.com/ai/home-design-ai-1784108411/?ref=featured&v=9177459"
            rel="nofollow noopener noreferrer"
            target="_blank"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Featured on There's An AI For That"
              className="h-auto max-w-full"
              decoding="async"
              loading="lazy"
              src="https://media.theresanaiforthat.com/featured-on-taaft.png?width=600"
              width="300"
            />
          </a>
          <a
            href="https://aiagentsdirectory.com/agent/ai-home-design"
            rel="noopener"
            target="_blank"
            title="Discover AI Home Design on AI Agents Directory"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="AI Home Design - Featured on AI Agents Directory"
              className="h-auto max-w-full"
              decoding="async"
              loading="lazy"
              src="https://aiagentsdirectory.com/featured-badge.svg?v=2024"
              width="200"
              height="50"
            />
          </a>
        </div>
      </section>
    </main>
  );
}
