export type ChatMessage = { role: "user" | "assistant"; content: string };

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
