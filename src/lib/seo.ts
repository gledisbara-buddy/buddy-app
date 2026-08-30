import type { Metadata } from "next";

// Root layout.tsx sätter openGraph.title/description till "Buddy" för hela
// sajten som default — men Next.js metadata slås ihop grunt per fält, så en
// undersida som bara sätter sin egen title/description (utan att också sätta
// openGraph/twitter) ärver ändå rotens openGraph-fält rakt av. Resultatet
// innan den här hjälpfunktionen: varenda sida hade samma og:title/og:description
// oavsett innehåll — delar man en nyhet eller guide såg förhandsvisningen ut
// som startsidan. Varje sidas metadata-export bör gå via den här funktionen
// istället för att bygga sin egen Metadata-literal.
export function pageMetadata({ title, description }: { title: string; description: string }): Metadata {
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}
