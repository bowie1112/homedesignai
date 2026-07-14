import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { floorPlanTools, homeDesignTools, ideaPages, roomPages } from "@/lib/site";

const footerColumns = [
  {
    title: "Home design",
    links: homeDesignTools.map((tool) => ({ label: tool.navLabel, href: tool.href })),
  },
  {
    title: "Floor plans",
    links: floorPlanTools.map((tool) => ({ label: tool.navLabel, href: tool.href })),
  },
  {
    title: "Explore",
    links: [
      ...roomPages.slice(0, 4).map((page) => ({ label: page.room, href: `/${page.slug}` })),
      ...ideaPages.slice(0, 2).map((page) => ({ label: page.title, href: `/ideas/${page.slug}` })),
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Affiliate", href: "/affiliate" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Sign in", href: "/auth/sign-in" },
    ],
  },
];

export function SiteFooter() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hello@homedesignai.co";
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--ink)] text-[var(--paper)]">
      <div className="site-shell py-16 sm:py-20">
        <div className="grid gap-12 border-b border-[color:oklch(96.8%_0.008_84/0.18)] pb-14 lg:grid-cols-[1.25fr_3fr]">
          <div>
            <BrandMark />
            <p className="mt-5 max-w-sm text-sm leading-6 text-[color:oklch(86%_0.02_84)]">
              AI home design tools for exploring interiors, staging, exteriors, gardens, landscapes, and floor plans before you renovate.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[color:oklch(72%_0.04_258)]">{column.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link className="text-sm text-[color:oklch(90%_0.01_84)] transition-colors hover:text-white" href={link.href}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-7 text-xs text-[color:oklch(72%_0.02_84)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Home Design AI. Concept tool, not construction advice.</p>
          <a className="inline-flex items-center gap-1 hover:text-white" href={`mailto:${supportEmail}`}>
            {supportEmail} <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </footer>
  );
}
