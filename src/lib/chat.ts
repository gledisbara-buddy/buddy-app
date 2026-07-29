export type ChatMessage = { role: "user" | "assistant"; content: string };

export const CHAT_SUGGESTIONS = [
  "Täcker min hemförsäkring vattenskador?",
  "Är jag dubbelförsäkrad?",
  "Hjälp mig anmäla en skada",
];

const CANNED_ANSWERS: Record<string, string> = {
  "täcker min hemförsäkring vattenskador?":
    "Ja, de flesta hemförsäkringar täcker plötsliga och oförutsedda vattenskador, men självrisk och villkor skiljer sig mellan bolag. Vill du att jag hjälper dig jämföra?",
  "är jag dubbelförsäkrad?":
    "Det är vanligt att ha viss överlappande täckning, till exempel reseskydd via både hemförsäkring och kort. Vill du att jag går igenom dina nuvarande försäkringar?",
  "hjälp mig anmäla en skada":
    "Absolut — jag kan hjälpa dig starta en skadeanmälan direkt. Vill du gå till anmälningsflödet nu?",
};

const FALLBACK_ANSWERS = [
  "Bra fråga! Det här är en demoversion av Buddy utan riktig AI ännu — i den färdiga appen skulle jag svara utifrån ditt faktiska avtal. Vill du prata med en specialist istället?",
  "Just nu kan jag bara visa hur gränssnittet fungerar, men i den riktiga appen kopplar vi på ett riktigt AI-svar här. Vill du boka in en specialist under tiden?",
];

export function getCannedReply(userText: string): string {
  const key = userText.trim().toLowerCase();
  if (CANNED_ANSWERS[key]) return CANNED_ANSWERS[key];
  return FALLBACK_ANSWERS[Math.floor(Math.random() * FALLBACK_ANSWERS.length)];
}

export function randomDelay(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
