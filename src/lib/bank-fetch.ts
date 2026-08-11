export type SuggestedSubscription =
  | { id: string; kind: "tv_streaming"; tjanst: string; prisPerManad: number }
  | { id: string; kind: "prenumeration"; namn: string; leverantor: string; prisPerManad: number };

// Exempeldata i samma anda som TV_STREAMING_TJANSTER/PRENUMERATION_LEVERANTORER
// i items.ts — verkliga leverantörsnamn, påhittade priser.
const CANDIDATES: SuggestedSubscription[] = [
  { id: "netflix", kind: "tv_streaming", tjanst: "Netflix", prisPerManad: 149 },
  { id: "hbo-max", kind: "tv_streaming", tjanst: "HBO Max", prisPerManad: 109 },
  { id: "viaplay", kind: "tv_streaming", tjanst: "Viaplay", prisPerManad: 139 },
  { id: "disney-plus", kind: "tv_streaming", tjanst: "Disney+", prisPerManad: 99 },
  { id: "sats", kind: "prenumeration", namn: "SATS", leverantor: "SATS", prisPerManad: 399 },
  { id: "storytel", kind: "prenumeration", namn: "Storytel", leverantor: "Storytel", prisPerManad: 169 },
  { id: "fitness24seven", kind: "prenumeration", namn: "Fitness24Seven", leverantor: "Fitness24Seven", prisPerManad: 289 },
  { id: "audible", kind: "prenumeration", namn: "Audible", leverantor: "Audible", prisPerManad: 99 },
];

/**
 * Simulerad avläsning av återkommande dragningar via bankkoppling (samma
 * "Demo"-princip som BankID-importen i policy-fetch.ts) — byts ut mot en
 * riktig Tink-liknande integration i en framtida fas, se
 * docs/kundresa-v2-steg2-plan.md, Del E.
 */
export function fetchBankSubscriptions(): Promise<SuggestedSubscription[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const shuffled = [...CANDIDATES].sort(() => Math.random() - 0.5);
      const count = 3 + Math.floor(Math.random() * 3);
      resolve(shuffled.slice(0, count));
    }, 1800);
  });
}
