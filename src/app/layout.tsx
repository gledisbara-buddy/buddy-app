import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { BuddyProvider } from "@/lib/buddy-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["500"],
});

const SITE_DESCRIPTION = "Din digitala assistent för allt du betalar för";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.minbuddy.se"),
  title: {
    default: "Buddy",
    template: "%s | Buddy",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "sv_SE",
    siteName: "Buddy",
    title: "Buddy",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Buddy",
    description: SITE_DESCRIPTION,
  },
};

// Håll medvetet minimal — bara fält vi faktiskt vet stämmer. Bolagsnamn,
// org.nr och adress läggs till här när det finns en riktig juridisk person
// bakom tjänsten (se villkor/integritetspolicy, som har samma lucka).
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Buddy",
  url: "https://www.minbuddy.se",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sv"
      className={`${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="font-sans min-h-full flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }} />
        <BuddyProvider>{children}</BuddyProvider>
      </body>
    </html>
  );
}
