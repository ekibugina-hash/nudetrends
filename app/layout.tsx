import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { PostHogProvider } from "./components/PostHogProvider";

const SITE_URL = "https://nudetrends.afrozex.com";

export const metadata: Metadata = {
  title: "NudeTrends — Premium Trending Videos & Nudes Uganda",
  description: "Watch exclusive trending premium videos and nudes on NudeTrends Uganda. We provide a secure network for the best hot Ugandan girls and top-rated adult leaked content. Browse our updated catalog daily!",
  keywords: [
    "nudes uganda", "porn ug", "pornography uganda", "hot sexy girls uganda",
    "kampala escorts", "ugandan nudes", "uganda leaks", "premium leaks uganda",
    "east africa porn", "ugandan sex videos", "kampala girls", "ugandan adult content",
    "nude trends", "trending nudes uganda", "uganda xxx", "uganda sex",
    "kampala nudes", "ugandan leaked videos", "ug porn", "nude ug",
    "nudetrends", "videosnudes", "status", "securenetwork", "trending"
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
        {/* Google Analytics */}
        <Script strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </head>
      <body className="font-sans bg-[#090909] text-[#f0f0f0] antialiased min-h-screen flex flex-col selection:bg-orange-500 selection:text-stone-950">
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
