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

export const metadata: Metadata = {
  metadataBase: new URL("https://buddy-app-iota.vercel.app"),
  title: {
    default: "Buddy",
    template: "%s | Buddy",
  },
  description: "Din digitala assistent för allt du betalar för",
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
        <BuddyProvider>{children}</BuddyProvider>
      </body>
    </html>
  );
}
