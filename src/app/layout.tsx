import type { Metadata } from "next";
import { Playfair_Display, Inter, Special_Elite, Boogaloo } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mywifesdumplings.vercel.app";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const specialElite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-ransom",
  display: "swap",
});

const boogaloo = Boogaloo({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-ransom-b",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "My Wife's Dumplings | Handmade Dumplings Auckland, NZ",
  description:
    "Handmade dumplings made with love in Auckland, NZ. Pork & chives, pork & cabbage. Order now.",
  openGraph: {
    title: "My Wife's Dumplings",
    description: "Handmade dumplings made with love in Auckland, NZ.",
    url: siteUrl,
    siteName: "My Wife's Dumplings",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Wife's Dumplings",
    description: "Handmade dumplings made with love in Auckland, NZ.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${specialElite.variable} ${boogaloo.variable}`}
    >
      <body className="font-body antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
