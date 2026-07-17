import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource-variable/instrument-sans";
import "./globals.css";
import { GoogleOneTap } from "@/components/google-one-tap";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const googleTagId = "G-RJZBHM75CQ";
const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? "xnut0m894z";
const socialTitle = "AI Home Design — Interior, Exterior & Room Design";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: `${SITE_NAME} — Interior, Exterior & Room Design`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: socialTitle,
    description: SITE_DESCRIPTION,
    images: [{ url: "/images/hero-interior.webp", width: 1536, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: socialTitle,
    description: SITE_DESCRIPTION,
    images: ["/images/hero-interior.webp"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f3ee",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script
          defer
          data-domain="homedesignai.co"
          data-api="https://metrics.homedesignai.co/api/v"
          src="https://metrics.homedesignai.co/js/m.js"
        />
      </head>
      <body>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`} strategy="afterInteractive" />
        <Script id="google-tag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${googleTagId}');
          `}
        </Script>
        {clarityProjectId ? (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${clarityProjectId}");
            `}
          </Script>
        ) : null}
        <GoogleOneTap />
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
