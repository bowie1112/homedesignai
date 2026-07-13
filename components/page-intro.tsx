export function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section className="border-b border-[var(--line)]">
      <div className="blueprint-grid">
        <div className="site-shell py-16 sm:py-24">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="display-title mt-6 max-w-[14ch] text-[clamp(3rem,7vw,5.6rem)]">{title}</h1>
          <p className="lede mt-7">{text}</p>
        </div>
      </div>
    </section>
  );
}
