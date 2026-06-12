import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

const SITE_URL = "https://nudetrends.afrozex.com";

export const metadata: Metadata = {
  title: "Nude Trends Uganda — #1 Premium Leaks, Nudes & Hot Girls Uganda",
  description: "Watch exclusive premium leaked videos and nudes Uganda. The #1 source for hot sexy girls Uganda, porn UG, pornography Uganda, kampala escorts, ugandan nudes and trending adult content.",
  keywords: [
    "nudes uganda", "porn ug", "pornography uganda", "hot sexy girls uganda",
    "kampala escorts", "ugandan nudes", "uganda leaks", "premium leaks uganda",
    "east africa porn", "ugandan sex videos", "kampala girls", "ugandan adult content",
    "nude trends", "trending nudes uganda", "uganda xxx", "uganda sex",
    "kampala nudes", "ugandan leaked videos", "ug porn", "nude ug"
  ],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Nude Trends Uganda — #1 Premium Leaks & Nudes",
    description: "The #1 source for premium leaks, nudes Uganda, porn UG, pornography Uganda, and hot sexy girls in Uganda. Watch free exclusive adult content.",
    url: SITE_URL,
    siteName: "Nude Trends Uganda",
    locale: "en_UG",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/logo.png`,
        width: 1200,
        height: 630,
        alt: "Nude Trends Uganda",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nude Trends Uganda — Premium Leaks & Nudes",
    description: "The #1 source for premium leaks, nudes Uganda, porn UG and hot girls Uganda.",
    images: [`${SITE_URL}/logo.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  verification: {
    google: "",
  },
};

const schemaOrg = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      "url": SITE_URL,
      "name": "Nude Trends Uganda",
      "description": "Uganda's #1 premium adult content platform featuring exclusive leaked videos and nudes.",
      "inLanguage": "en-UG",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${SITE_URL}/?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      "name": "Nude Trends Uganda",
      "url": SITE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/logo.png`
      },
      "description": "Uganda's #1 premium adult content platform.",
      "areaServed": "Uganda"
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-UG" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
        {/* PostHog Analytics */}
        <Script id="posthog-init" strategy="afterInteractive">
          {`
            !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]);t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+" (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
            posthog.init('phc_PLACEHOLDER_KEY',{api_host:'https://app.posthog.com'})
          `}
        </Script>
      </head>
      <body className="font-sans bg-[#090909] text-[#f0f0f0] antialiased min-h-screen flex flex-col selection:bg-orange-500 selection:text-stone-950">
        {children}
      </body>
    </html>
  );
}
