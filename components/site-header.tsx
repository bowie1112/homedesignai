"use client";

import { ChevronDown, Menu, MoveRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { navGroups } from "@/lib/site";
import { createClient } from "@/lib/supabase/client";

function AccountLink({ mobile = false, signedIn }: { mobile?: boolean; signedIn: boolean | null }) {
  if (signedIn === null) return <span aria-hidden="true" className={mobile ? "h-11" : "h-10 w-16"} />;
  return <Link className={mobile ? "button-ghost" : "button-ghost px-3 text-sm"} href={signedIn ? "/account" : "/auth/sign-in"}>{signedIn ? "Account" : "Sign in"}</Link>;
}

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const supabase = createClient();
      let active = true;
      void supabase.auth.getSession().then(({ data }) => {
        if (active) setSignedIn(Boolean(data.session));
      }).catch(() => {
        if (active) setSignedIn(false);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (active) setSignedIn(Boolean(session));
      });
      return () => {
        active = false;
        subscription.unsubscribe();
      };
    } catch {
      setSignedIn(false);
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <div className="relative z-[70] flex min-h-10 items-center justify-center bg-[var(--ink)] px-4 py-2 text-center text-xs font-medium text-[var(--paper)]">
        <span>Registered users get 3 free Basic generations every day.</span>
        <Link className="ml-2 inline-flex items-center gap-1 font-bold underline-offset-4 hover:underline" href="/pricing">
          View plans <MoveRight size={13} />
        </Link>
      </div>
      <header className="sticky top-0 z-[60] border-b border-[var(--line)] bg-[color:oklch(96.8%_0.008_84/0.94)] backdrop-blur-lg">
        <div className="site-shell flex h-16 items-center justify-between gap-6">
          <BrandMark />
          <nav className="hidden h-full items-center gap-1 lg:flex" aria-label="Main navigation">
            {navGroups.map((group) => (
              <div
                className="group relative flex h-full items-center"
                key={group.label}
                onMouseEnter={() => setOpenMenu(group.label)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button
                  aria-expanded={openMenu === group.label}
                  className="button-ghost gap-1.5 px-3 text-sm"
                  onClick={() => setOpenMenu(openMenu === group.label ? null : group.label)}
                  type="button"
                >
                  {group.label}
                  <ChevronDown className={`transition-transform ${openMenu === group.label ? "rotate-180" : ""}`} size={15} />
                </button>
                <div
                  className={`absolute left-1/2 top-[calc(100%-1px)] w-[620px] -translate-x-1/2 border border-[var(--line)] bg-[var(--white)] p-3 shadow-[var(--shadow-lg)] transition-[opacity,transform,visibility] duration-200 ${
                    openMenu === group.label ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
                  }`}
                >
                  <div className="grid grid-cols-2 gap-1">
                    {group.items.map((item) => (
                      <Link
                        className="group/item min-h-[84px] border border-transparent p-3 transition-colors hover:border-[var(--line)] hover:bg-[var(--paper)] focus-visible:border-[var(--blue)]"
                        href={item.href}
                        key={item.href}
                      >
                        <span className="flex items-center justify-between text-sm font-bold tracking-[-0.02em]">
                          {item.label}
                          <MoveRight className="text-[var(--blue)] opacity-0 transition-all group-hover/item:translate-x-1 group-hover/item:opacity-100" size={16} />
                        </span>
                        <span className="mt-1.5 line-clamp-2 block text-xs leading-5 text-[var(--ink-soft)]">{item.description}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <Link className="button-ghost px-3 text-sm" href="/ideas/small-living-room-ideas">Ideas</Link>
            <Link className="button-ghost px-3 text-sm" href="/pricing">Pricing</Link>
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <AccountLink signedIn={signedIn} />
            <Link className="button-primary min-h-10 px-4 text-sm" href="/interior-design-ai">Create a design</Link>
          </div>
          <button
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            className="grid size-11 place-items-center lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            type="button"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>
      <div
        aria-hidden={!mobileOpen}
        className={`fixed inset-0 z-50 bg-[color:oklch(22%_0.035_257/0.38)] transition-opacity lg:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        aria-label="Mobile navigation"
        className={`fixed bottom-0 right-0 top-[104px] z-[55] w-[min(88vw,360px)] overflow-y-auto border-l border-[var(--line)] bg-[var(--paper)] px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-4 shadow-[var(--shadow-lg)] transition-transform duration-300 lg:hidden ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {navGroups.map((group) => (
          <details className="border-b border-[var(--line)] py-2" key={group.label} open={group.label === "Home design"}>
            <summary className="flex min-h-12 list-none items-center justify-between text-sm font-bold">
              {group.label}<ChevronDown size={16} />
            </summary>
            <div className="pb-3">
              {group.items.map((item) => (
                <Link className="flex min-h-11 items-center justify-between text-sm text-[var(--ink-soft)]" href={item.href} key={item.href}>
                  {item.label}<MoveRight size={14} />
                </Link>
              ))}
            </div>
          </details>
        ))}
        <div className="grid gap-2 pt-5">
          <Link className="button-secondary" href="/pricing">View pricing</Link>
          <Link className="button-primary" href="/interior-design-ai">Create a design</Link>
          <AccountLink mobile signedIn={signedIn} />
        </div>
      </aside>
    </>
  );
}
