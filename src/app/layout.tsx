import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const siteUrl = "https://rain-shift.vercel.app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Risk of Rain 2 Save Editor | RainShift",
  description:
    "Free Risk of Rain 2 save editor for unlocking survivors, skills, items, artifacts and achievements, managing lunar coins, and exporting your XML profile.",
  applicationName: "RainShift",
  category: "gaming",
  creator: "SlothfulDreams",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "Risk of Rain 2",
    "RoR2",
    "save editor",
    "unlock",
    "achievements",
    "characters",
    "items",
    "skills",
  ],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "RainShift",
    title: "Risk of Rain 2 Save Editor | RainShift",
    description:
      "Edit your Risk of Rain 2 profile in your browser. Unlock survivors, skills, items, artifacts and achievements, or manage lunar coins.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Risk of Rain 2 Save Editor | RainShift",
    description:
      "Edit your Risk of Rain 2 profile in your browser and export the updated XML save file.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "RainShift",
  url: siteUrl,
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "RainShift",
  alternateName: "RainShift Risk of Rain 2 Save Editor",
  url: siteUrl,
  description:
    "A free browser-based save editor for Risk of Rain 2 profiles, survivors, skills, items, artifacts, achievements, and lunar coins.",
  applicationCategory: "GameApplication",
  applicationSubCategory: "Save editor",
  operatingSystem: "Windows",
  browserRequirements: "Requires a modern web browser with JavaScript enabled.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  isAccessibleForFree: true,
  author: {
    "@type": "Person",
    name: "SlothfulDreams",
    url: "https://github.com/SlothfulDreams",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: This static JSON-LD contains no user-provided values.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([websiteStructuredData, structuredData]),
          }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
