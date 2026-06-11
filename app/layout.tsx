import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nude Trends — Premium Egress-Free Stream Network",
  description: "Premium adult content and exclusive leaks network.",
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
