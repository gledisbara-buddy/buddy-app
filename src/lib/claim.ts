export type ChatMessage = { role: "user" | "assistant"; content: string };

// Ersätter det gamla binära ny/hanterad för skadeärenden med ett riktigt
// statusspår — dels för att kunden ska se var i processen anmälan är
// (mindre "vad händer nu"-oro), dels så en handläggare kan sätta rätt
// läge istället för en enda "hanterad"-flagga som dolde om det var
// godkänt, nekat eller bara under utredning.
export type ClaimStatus = "mottagen" | "under_utredning" | "godkand" | "nekad" | "utbetald";

// Den "raka vägen" ett godkänt ärende går igenom — används för
// stegvisningen hos kunden. "nekad" är en sidogren, inte ett steg i den
// här listan.
export const CLAIM_STATUS_STEPS: ClaimStatus[] = ["mottagen", "under_utredning", "godkand", "utbetald"];

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  mottagen: "Mottagen",
  under_utredning: "Under utredning",
  godkand: "Godkänd",
  nekad: "Nekad",
  utbetald: "Utbetald",
};

export function claimStatusColor(status: ClaimStatus): string {
  if (status === "nekad") return "text-red-600";
  if (status === "godkand" || status === "utbetald") return "text-forest";
  return "text-amber-deep";
}

export type Classification = {
  skadetyp: string;
  allvarlighetsgrad: string;
  tidsuppskattning: string;
  sammanfattning: string;
};

const FOLLOW_UPS = ["Var hände det?", "Ungefär när hände det?"];

export function getIntakeReply(exchangeIndex: number): string {
  if (exchangeIndex < FOLLOW_UPS.length) return FOLLOW_UPS[exchangeIndex];
  return "Tack, det hjälper mig förstå vad som hänt. Nu behöver jag bara ett foto på skadan (och gärna kvitton) för att kunna skicka in anmälan.";
}

export function buildClassification(): Classification {
  return {
    skadetyp: "Skada i hemmet",
    allvarlighetsgrad: "Medel",
    tidsuppskattning: "Uppskattas inom 3–5 arbetsdagar",
    sammanfattning: "Din skada har registrerats och granskas nu av en handläggare.",
  };
}
