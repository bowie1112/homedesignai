type LegalKind = "privacy" | "terms";

type LegalSection = {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
};

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hello@homedesignai.co";
const lastUpdated = "July 16, 2026";

const privacySections: LegalSection[] = [
  {
    id: "scope",
    title: "Scope and contact",
    body: [
      "This Privacy Policy explains how Home Design AI collects, uses, stores, and shares information when you visit our website, create an account, upload design references, generate AI design concepts, buy credits, or contact support.",
      "Home Design AI is an online design visualization service. If you have questions about privacy or want to exercise a data right, contact us by email.",
    ],
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    body: [
      "We collect information you provide directly, information created when you use the service, and limited technical information needed to run the product safely.",
    ],
    bullets: [
      "Account information, such as email address, name, avatar, authentication provider, and account identifiers.",
      "Design content, such as uploaded room photos, floor plans, prompts, selected tools, generation settings, generated images, and job status.",
      "Billing records, such as Stripe customer, order, subscription, invoice, payment, plan, and credit-transaction references. We do not store full card numbers.",
      "Usage and device information, such as pages visited, browser type, IP address, approximate location from technical signals, product events, diagnostics, and security logs.",
      "Support communications, including the messages and files you choose to send us.",
    ],
  },
  {
    id: "how-we-use-information",
    title: "How we use information",
    body: [
      "We use information to provide the service, protect accounts, process purchases, improve the product, and comply with legal obligations.",
    ],
    bullets: [
      "Create and maintain your account, authentication session, credit balance, subscriptions, orders, and generation history.",
      "Upload, process, display, download, share, and delete the design inputs and outputs you request.",
      "Operate fraud prevention, abuse detection, service monitoring, debugging, analytics, and product measurement.",
      "Send transactional messages, respond to support requests, enforce our terms, and meet tax, accounting, or legal duties.",
    ],
  },
  {
    id: "ai-processing",
    title: "AI generation and third-party processing",
    body: [
      "To generate the results you request, we may share prompts and temporary, access-controlled links to uploaded images with third-party AI processing providers. These links are created for generation workflows and are not intended to expose your private files publicly.",
      "Input links sent for AI processing are short lived. Result links shown inside the product are also time limited. Providers may process the content only as needed to complete, secure, monitor, or support the requested generation, subject to their own infrastructure and legal obligations.",
    ],
  },
  {
    id: "payments",
    title: "Payments",
    body: [
      "Payments, subscriptions, invoices, taxes, and card details are handled by Stripe. Home Design AI stores billing identifiers and transaction status so we can grant credits, display account billing state, reconcile purchases, prevent duplicate grants, and support refunds or billing questions.",
    ],
  },
  {
    id: "analytics-cookies",
    title: "Analytics, cookies, and similar technologies",
    body: [
      "We use cookies, local storage, pixels, and similar technologies for authentication, security, preferences, checkout, analytics, and product measurement. Our analytics may include tools such as Google Analytics and privacy-focused traffic measurement.",
      "You can control many cookies through your browser settings. Blocking some cookies may prevent sign-in, checkout, saved sessions, or account features from working correctly.",
    ],
  },
  {
    id: "sharing",
    title: "How we share information",
    body: [
      "We do not sell your personal information. We share information only where needed to operate Home Design AI, process your requests, protect the service, or comply with law.",
    ],
    bullets: [
      "Infrastructure and hosting providers, including database, storage, deployment, monitoring, and security services.",
      "Authentication, payment, analytics, and customer-support providers.",
      "Third-party AI processing providers that help generate requested design outputs.",
      "Professional advisers, authorities, or other parties when required to comply with law, enforce terms, protect rights, or complete a business transfer such as a merger, financing, or acquisition.",
    ],
  },
  {
    id: "storage-security",
    title: "Storage and security",
    body: [
      "Uploads and generated results are stored in private storage and accessed through controlled permissions or signed links. We use reasonable administrative, technical, and organizational safeguards designed to protect account data, design files, billing records, and service logs.",
      "No online service can guarantee absolute security. You are responsible for keeping your login credentials secure and for using the product only from devices and networks you trust.",
    ],
  },
  {
    id: "retention-deletion",
    title: "Retention and deletion",
    body: [
      "We keep account, billing, generation, analytics, and support information for as long as needed to provide the service, maintain accurate records, resolve disputes, prevent abuse, comply with legal obligations, and improve the product.",
      "You can delete individual completed generation records from supported product surfaces. When deletion is completed, the related input and result files and job record are removed from active product storage. Some security, analytics, billing, backup, or legal records may remain where retention is required or proportionate.",
    ],
  },
  {
    id: "rights",
    title: "Your privacy choices and rights",
    body: [
      "Depending on where you live, you may have rights to access, correct, delete, export, restrict, or object to certain processing of your personal information. You may also withdraw consent where processing is based on consent.",
      "To make a request, contact us at the email below. We may need to verify your identity before completing a request. We will not discriminate against you for exercising privacy rights required by applicable law.",
    ],
  },
  {
    id: "international",
    title: "International use",
    body: [
      "Home Design AI and its service providers may process information in countries other than your own. Those countries may have different data-protection laws. Where required, we use appropriate safeguards for international transfers.",
    ],
  },
  {
    id: "children",
    title: "Children",
    body: [
      "Home Design AI is intended for users who are at least 18 years old. We do not knowingly collect personal information from children. If you believe a child provided information to us, contact us so we can review and remove it where appropriate.",
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: [
      "We may update this Privacy Policy as the product, providers, laws, or business needs change. The updated version will be posted on this page with a new last-updated date. Material changes may be communicated through the product or by email when appropriate.",
    ],
  },
];

const termsSections: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreement to these terms",
    body: [
      "These Terms of Service govern your access to and use of Home Design AI. By creating an account, uploading content, generating results, buying credits, or using the website, you agree to these terms and to our Privacy Policy.",
      "If you do not agree, do not use the service.",
    ],
  },
  {
    id: "eligibility",
    title: "Eligibility",
    body: [
      "You must be at least 18 years old and able to form a binding agreement to use Home Design AI. You are responsible for the activity on your account and for keeping your login credentials secure.",
    ],
  },
  {
    id: "service",
    title: "The service",
    body: [
      "Home Design AI lets users upload room images, floor plans, or design references and request AI-generated visualization concepts. Outputs are generated by automated systems and may vary in quality, accuracy, style, scale, and availability.",
      "The service may rely on third-party infrastructure, authentication, payment, analytics, storage, and AI processing providers. We may change, suspend, limit, or discontinue features when needed to operate, improve, secure, or comply with obligations for the service.",
    ],
  },
  {
    id: "accounts",
    title: "Accounts and security",
    body: [
      "You agree to provide accurate account information and to use only accounts you are authorized to use. You must notify us if you believe your account has been compromised. We may refuse, suspend, or terminate access when needed to protect users, the service, or legal rights.",
    ],
  },
  {
    id: "credits-billing",
    title: "Credits, subscriptions, and billing",
    body: [
      "Home Design AI uses credits for AI generations. New accounts may receive 3 signup credits. Basic generations cost 1 credit. Pro generations cost 3 credits. Credits do not expire while your account remains active, but they have no cash value and are not transferable unless we say otherwise in writing.",
      "We offer one-time credit packs and monthly subscriptions. Subscription credits are granted according to the plan terms and accumulate in your account. Subscriptions renew automatically until canceled. You can manage payment methods and cancel subscriptions through Stripe's secure billing portal when available in your account.",
      "Prices, plan names, included credits, taxes, and supported payment methods may change. If a payment fails, we may pause credit grants, subscription access, or billing-related features until payment is resolved.",
    ],
  },
  {
    id: "refunds",
    title: "Refunds and cancellations",
    body: [
      "Failed model jobs are eligible for an automatic credit return when our systems determine the generation was not completed successfully.",
      "For paid purchases, your first purchase may be refunded within 7 days only if the associated paid credits are wholly unused. Used credits, renewal charges, partially used purchases, subscription periods that have already started, and consumed generations are not refundable unless required by law or unless we confirm a duplicate charge or documented billing error.",
      "Canceling a subscription stops future renewals; it does not automatically refund the current billing period or remove credits already granted, unless applicable law requires otherwise.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: [
      "You may not misuse Home Design AI or help anyone else misuse it.",
    ],
    bullets: [
      "Do not upload content you do not have the right to use or content that violates privacy, intellectual-property, publicity, or other rights.",
      "Do not use the service for illegal, harmful, abusive, deceptive, infringing, or security-violating activity.",
      "Do not attempt to reverse engineer, scrape, overload, bypass limits, interfere with, or gain unauthorized access to the service or its providers.",
      "Do not present AI concepts as approved architectural, engineering, construction, code, accessibility, safety, or permit documents.",
    ],
  },
  {
    id: "user-content",
    title: "Your content and license to operate the service",
    body: [
      "You keep ownership of content you upload, subject to any rights held by others. You grant Home Design AI a worldwide, non-exclusive, royalty-free license to host, store, copy, process, transmit, display, create outputs from, and otherwise use your uploaded content and prompts as needed to provide, secure, support, and improve the service.",
      "You represent that you have the rights and permissions needed for the content you upload and the instructions you submit.",
    ],
  },
  {
    id: "outputs",
    title: "AI outputs",
    body: [
      "Subject to your compliance with these terms and applicable law, you may use generated outputs for personal or commercial design visualization purposes. AI outputs may not be unique, may resemble outputs generated for other users, and may contain errors or unexpected elements.",
      "We do not guarantee that outputs are accurate, exclusive, protectable by copyright, non-infringing, suitable for a particular use, or accepted by any platform, client, authority, contractor, or professional.",
    ],
  },
  {
    id: "professional-review",
    title: "Design and construction disclaimer",
    body: [
      "Home Design AI provides exploratory visual concepts only. It does not provide architecture, engineering, interior-design licensing, building-code, safety, accessibility, electrical, plumbing, structural, permitting, cost-estimating, or construction advice.",
      "Before relying on any design idea for renovation, purchasing, construction, compliance, or safety decisions, you must verify measurements, materials, feasibility, code requirements, permits, and site conditions with qualified professionals.",
    ],
  },
  {
    id: "platform-ip",
    title: "Home Design AI intellectual property",
    body: [
      "The website, software, workflows, interface, brand, text, graphics, templates, and other service materials are owned by Home Design AI or its licensors. These terms do not transfer ownership of the platform to you.",
    ],
  },
  {
    id: "third-party-services",
    title: "Third-party services",
    body: [
      "The service depends on third-party providers for hosting, storage, authentication, payments, analytics, and AI processing. Their services may have separate terms and privacy notices. We are not responsible for third-party outages, changes, processing delays, or errors outside our reasonable control.",
    ],
  },
  {
    id: "termination",
    title: "Suspension and termination",
    body: [
      "You may stop using the service at any time. You may request account deletion by contacting support. We may suspend or terminate access if you violate these terms, create risk for the service, fail to pay amounts due, or use the product in a way that may cause legal, security, operational, or reputational harm.",
      "After termination or deletion, access to account features, generation history, files, subscriptions, and remaining credits may be lost, subject to our retention obligations and applicable law.",
    ],
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: [
      "To the maximum extent permitted by law, Home Design AI is provided on an as-is and as-available basis. We disclaim warranties of merchantability, fitness for a particular purpose, non-infringement, uninterrupted availability, accuracy, and error-free operation.",
    ],
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: [
      "To the maximum extent permitted by law, Home Design AI and its owners, operators, affiliates, service providers, and licensors will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost data, lost business, design errors, construction decisions, or substitute services.",
      "To the maximum extent permitted by law, our total liability for any claim relating to the service is limited to the amount you paid to Home Design AI for the service in the 12 months before the event giving rise to the claim.",
    ],
  },
  {
    id: "indemnity",
    title: "Indemnity",
    body: [
      "You agree to defend, indemnify, and hold harmless Home Design AI and its owners, operators, affiliates, service providers, and licensors from claims, damages, liabilities, losses, and expenses arising from your content, your use of the service, your violation of these terms, or your violation of another person's rights.",
    ],
  },
  {
    id: "disputes",
    title: "Governing law and disputes",
    body: [
      "These terms are governed by applicable laws, without regard to conflict-of-law rules. Before starting a formal dispute, you agree to contact us and try to resolve the issue in good faith. Any unresolved dispute will be handled by courts of competent jurisdiction unless applicable law requires another forum.",
    ],
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: [
      "We may update these terms as the service, providers, laws, or business needs change. The updated version will be posted on this page with a new last-updated date. Continued use of the service after changes become effective means you accept the updated terms.",
    ],
  },
];

const legalCopy = {
  privacy: {
    title: "Privacy Policy",
    summary: "How Home Design AI handles account data, private uploads, AI generation requests, payments, analytics, retention, and privacy choices.",
    sections: privacySections,
  },
  terms: {
    title: "Terms of Service",
    summary: "The rules for using Home Design AI, including credits, subscriptions, refunds, acceptable use, AI outputs, and design disclaimers.",
    sections: termsSections,
  },
} satisfies Record<LegalKind, { title: string; summary: string; sections: LegalSection[] }>;

export function LegalPage({ kind }: { kind: LegalKind }) {
  const page = legalCopy[kind];

  return (
    <main id="main-content">
      <section className="border-b border-[var(--line)]">
        <div className="blueprint-grid">
          <div className="site-shell py-16 sm:py-24">
            <span className="eyebrow">Legal</span>
            <h1 className="display-title mt-6 max-w-[14ch] text-[clamp(3rem,7vw,5.6rem)]">{page.title}</h1>
            <p className="lede mt-7">{page.summary}</p>
            <p className="mt-6 text-sm font-semibold text-[var(--ink-soft)]">Last updated {lastUpdated}</p>
          </div>
        </div>
      </section>

      <article className="site-shell max-w-5xl py-16 sm:py-24">
        <aside aria-label="On this page" className="border-y border-[var(--line)] py-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">On this page</h2>
          <ol className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            {page.sections.map((section, index) => (
              <li key={section.id}>
                <a className="group inline-flex gap-3 text-[var(--ink-soft)] hover:text-[var(--blue-deep)]" href={`#${section.id}`}>
                  <span className="font-bold text-[var(--blue)]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="underline-offset-4 group-hover:underline">{section.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <div className="mt-12 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {page.sections.map((section, index) => (
            <section className="grid gap-4 py-8 sm:grid-cols-[56px_1fr]" id={section.id} key={section.id}>
              <span className="text-xs font-bold text-[var(--blue)]">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h2 className="text-2xl font-semibold">{section.title}</h2>
                <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--ink-soft)]">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets ? (
                    <ul className="list-disc space-y-2 pl-5">
                      {section.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </section>
          ))}
        </div>

        <p className="mt-8 text-sm">
          Questions or requests?{" "}
          <a className="font-bold text-[var(--blue-deep)] underline" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>
        </p>
      </article>
    </main>
  );
}
