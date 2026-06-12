import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nude Trends — Premium Escorts & Hot Leaks Uganda",
  description: "Exclusive premium leaks, hot sexy girls Uganda, nudes Uganda, porn UG, pornography Uganda, and the latest trending adult content from Uganda and East Africa.",
  keywords: [
    "nudes uganda", "porn ug", "pornography uganda", "hot sexy girls uganda", "kampala escorts", "ugandan nudes", "uganda leaks", "premium leaks uganda", "east africa porn", "ugandan sex videos", "kampala girls", "ugandan adult content", "nude trends", "trending nudes uganda"
  ],
  openGraph: {
    title: "Nude Trends Uganda — Premium Adult Network",
    description: "The #1 source for premium leaks, nudes Uganda, porn UG, pornography Uganda, and hot sexy girls in Uganda.",
    url: "https://nudetrends.afrozex.com",
    siteName: "Nude Trends",
    locale: "en_UG",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-[#090909] text-[#f0f0f0] antialiased min-h-screen flex flex-col selection:bg-orange-500 selection:text-stone-950">
        {children}
      </body>
    </html>
  );
}
