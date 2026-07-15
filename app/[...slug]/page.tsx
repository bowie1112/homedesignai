import type { Metadata } from "next";
import { ArrowUpRight, MoveRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GeneratorWorkbench } from "@/components/generator-workbench";
import { ToolLandingPage } from "@/components/tool-landing-page";
import { UnitConverter } from "@/components/unit-converter";
import { converterPages, ideaPages, roomPages, toolMap, tools } from "@/lib/site";

type PageProps = { params: Promise<{ slug: string[] }> };

export function generateStaticParams() {
  return [
    ...tools.map((tool) => ({ slug: [tool.key] })),
    ...roomPages.map((page) => ({ slug: [page.slug] })),
    ...ideaPages.map((page) => ({ slug: ["ideas", page.slug] })),
    ...converterPages.map((page) => ({ slug: ["tools", page.slug] })),
    ...["privacy", "terms", "affiliate"].map((slug) => ({ slug: [slug] })),
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const path = slug.join("/");
  const tool = toolMap.get(path as Parameters<typeof toolMap.get>[0]);
  if (tool) {
    return {
      title: tool.metaTitle ? { absolute: tool.metaTitle } : tool.title,
      description: tool.metaDescription ?? tool.description,
      alternates: { canonical: tool.href },
    };
  }
  const room = roomPages.find((page) => page.slug === path);
  if (room) return { title: room.title, description: `Create a thoughtful ${room.room.toLowerCase()} layout with an AI floor plan generator.`, alternates: { canonical: `/${room.slug}` } };
  const idea = slug[0] === "ideas" ? ideaPages.find((page) => page.slug === slug[1]) : undefined;
  if (idea) return { title: idea.title, description: idea.summary, alternates: { canonical: `/ideas/${idea.slug}` } };
  const converter = slug[0] === "tools" ? converterPages.find((page) => page.slug === slug[1]) : undefined;
  if (converter) return { title: `${converter.title} Converter`, description: `Convert ${converter.from} to ${converter.to} instantly.`, alternates: { canonical: `/tools/${converter.slug}` } };
  const titles: Record<string, string> = { privacy: "Privacy Policy", terms: "Terms of Service", affiliate: "Affiliate Program" };
  if (titles[path]) return { title: titles[path], alternates: { canonical: `/${path}` } };
  return { title: "Page" };
}

export default async function CatchAllPage({ params }: PageProps) {
  const { slug } = await params;
  const path = slug.join("/");
  const tool = toolMap.get(path as Parameters<typeof toolMap.get>[0]);
  if (tool) return <ToolLandingPage tool={tool} />;

  const room = roomPages.find((page) => page.slug === path);
  if (room) return <RoomPage room={room.room} title={room.title} />;

  if (slug[0] === "ideas") {
    const idea = ideaPages.find((page) => page.slug === slug[1]);
    if (idea) return <IdeaPage summary={idea.summary} title={idea.title} />;
  }

  if (slug[0] === "tools") {
    const converter = converterPages.find((page) => page.slug === slug[1]);
    if (converter) return <ConverterPage converter={converter} />;
  }

  if (path === "privacy") return <LegalPage kind="privacy" />;
  if (path === "terms") return <LegalPage kind="terms" />;
  if (path === "affiliate") return <AffiliatePage />;
  notFound();
}

function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <section className="border-b border-[var(--line)]"><div className="blueprint-grid"><div className="site-shell py-16 sm:py-24"><span className="eyebrow">{eyebrow}</span><h1 className="display-title mt-6 max-w-[14ch] text-[clamp(3rem,7vw,5.6rem)]">{title}</h1><p className="lede mt-7">{text}</p></div></div></section>;
}

function RoomPage({ room, title }: { room: string; title: string }) {
  const notes = [
    `List the activities the ${room.toLowerCase()} must support before naming a style.`,
    "Call out fixed walls, openings, plumbing, or circulation that the concept should preserve.",
    "Treat the output as a discussion image, then verify measurements and code with a professional.",
  ];
  return <main id="main-content"><PageIntro eyebrow={`${room} planning`} title={title} text={`Explore a clearer ${room.toLowerCase()} arrangement from a short brief. Describe the dimensions, adjacencies, and daily routines that matter.`} /><section className="site-shell py-16 sm:py-24"><GeneratorWorkbench defaultTool="floor-plan-generator" /></section><section className="border-y border-[var(--line)] bg-[var(--white)] py-20"><div className="site-shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr]"><h2 className="section-title">A better brief for a better {room.toLowerCase()} plan.</h2><ol className="divide-y divide-[var(--line)] border-y border-[var(--line)]">{notes.map((note, index) => <li className="grid gap-4 py-6 sm:grid-cols-[42px_1fr]" key={note}><span className="text-xs font-bold text-[var(--blue)]">0{index + 1}</span><p className="text-sm leading-6 text-[var(--ink-soft)]">{note}</p></li>)}</ol></div></section></main>;
}

function IdeaPage({ title, summary }: { title: string; summary: string }) {
  const principles = [
    { title: "Start with the plan", text: "Resolve paths, storage, and furniture clearances before adding visual detail." },
    { title: "Limit the material story", text: "Two or three related materials usually create more continuity than a catalog of finishes." },
    { title: "Design the light", text: "Use task, ambient, and accent lighting deliberately rather than relying on one central fixture." },
    { title: "Keep one strong gesture", text: "A room becomes memorable through one clear move, supported by quieter decisions." },
  ];
  return <main id="main-content"><PageIntro eyebrow="Design ideas" title={title} text={summary} /><section className="site-shell grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr]"><div className="relative aspect-[4/3] overflow-hidden border border-[var(--line)]"><Image alt={`Original editorial image for ${title}`} className="object-cover" fill priority sizes="(max-width: 1024px) 100vw, 54vw" src="/images/hero-interior.webp" /></div><div><span className="eyebrow">A practical starting point</span><h2 className="section-title mt-5">Make the room feel inevitable, not decorated.</h2><p className="lede mt-6">Good rooms usually come from a small number of aligned choices: proportion, use, light, and material continuity.</p><Link className="button-primary mt-8" href="/interior-design-ai">Visualize your room <MoveRight size={16} /></Link></div></section><section className="border-y border-[var(--line)] bg-[var(--white)] py-20"><div className="site-shell"><h2 className="section-title">Four principles to carry into the brief.</h2><div className="mt-10 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">{principles.map((item, index) => <article className="min-h-60 bg-[var(--paper)] p-6" key={item.title}><span className="text-xs font-bold text-[var(--blue)]">0{index + 1}</span><h3 className="mt-12 text-xl font-semibold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{item.text}</p></article>)}</div></div></section></main>;
}

function ConverterPage({ converter }: { converter: (typeof converterPages)[number] }) {
  return <main id="main-content"><PageIntro eyebrow="Dimension tools" title={`${converter.title} Converter`} text={`Convert ${converter.from} to ${converter.to} while reading a plan, checking furniture dimensions, or preparing a design brief.`} /><section className="site-shell max-w-4xl py-16 sm:py-24"><UnitConverter factor={converter.factor} from={converter.from} to={converter.to} /><div className="mt-10 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2"><div className="bg-[var(--white)] p-6"><h2 className="text-lg font-semibold">How it works</h2><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">Multiply the source measurement by {converter.factor}. Results are rounded to four decimal places when needed.</p></div><div className="bg-[var(--white)] p-6"><h2 className="text-lg font-semibold">Planning note</h2><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">For construction documents, keep one unit system throughout and confirm critical dimensions on site.</p></div></div></section></main>;
}

function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const isPrivacy = kind === "privacy";
  const sections = isPrivacy ? [
    ["Information we process", "Account details, uploaded images, generation prompts, billing references, and technical service logs needed to operate and secure the product."],
    ["How images are handled", "Uploads and generated results are stored privately. Short-lived signed links may be shared with the generation provider only to complete your requested job."],
    ["Payments", "Stripe processes payment details. Home Design AI stores billing identifiers and transaction status, not full card data."],
    ["Your choices", "You may request access, correction, or deletion of account data by contacting support."],
  ] : [
    ["Concept use", "Outputs are exploratory design images, not architectural, engineering, construction, code, or permit documents."],
    ["Credits", "Basic generations cost 1 credit and Pro generations cost 3 credits. Credits do not expire. Failed model jobs are eligible for automatic credit return."],
    ["Acceptable use", "You may not use the service to infringe rights, bypass security, upload unlawful material, or misrepresent an AI concept as approved construction documentation."],
    ["Availability", "We work to keep the service reliable, but model and payment providers may experience delays or outages."],
  ];
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hello@homedesignai.co";
  return <main id="main-content"><PageIntro eyebrow="Legal" title={isPrivacy ? "Privacy Policy" : "Terms of Service"} text={`Plain-language ${isPrivacy ? "privacy information" : "terms"} for Home Design AI. Last updated July 10, 2026.`} /><article className="site-shell max-w-4xl py-16 sm:py-24"><div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">{sections.map(([title, text], index) => <section className="grid gap-4 py-7 sm:grid-cols-[44px_1fr]" key={title}><span className="text-xs font-bold text-[var(--blue)]">0{index + 1}</span><div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{text}</p></div></section>)}</div><p className="mt-8 text-sm">Questions? <a className="font-bold text-[var(--blue-deep)] underline" href={`mailto:${supportEmail}`}>{supportEmail}</a></p></article></main>;
}

function AffiliatePage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hello@homedesignai.co";
  return <main id="main-content"><PageIntro eyebrow="Affiliate program" title="Share better ways to begin a design." text="A transparent referral program for educators, renovation writers, real-estate creators, and design communities." /><section className="site-shell py-16 sm:py-24"><div className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">{[{ title: "Apply", text: "Tell us about your audience and the way you plan to introduce the product." }, { title: "Share", text: "Use an attributed link and original, accurate demonstrations—never fabricated results." }, { title: "Earn", text: "Approved partners receive the agreed commission on eligible purchases." }].map((item, index) => <article className="min-h-64 bg-[var(--white)] p-6" key={item.title}><span className="text-xs font-bold text-[var(--blue)]">0{index + 1}</span><h2 className="mt-14 text-2xl font-semibold">{item.title}</h2><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{item.text}</p></article>)}</div><a className="button-primary mt-8" href={`mailto:${supportEmail}?subject=Home%20Design%20AI%20affiliate%20application`}>Apply by email <ArrowUpRight size={16} /></a></section></main>;
}
