export type FaqItem = { question: string; answer: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Kostar det något att lägga in mina saker i Buddy?",
    answer:
      "Nej, det är alltid kostnadsfritt att skapa en översikt och lägga in dina saker. Du betalar först om du väljer att teckna en försäkring.",
  },
  {
    question: "Måste jag lägga in allt på en gång?",
    answer:
      "Nej. Du kan hoppa över onboardingen helt och lägga till en sak i taget senare, direkt från din översikt.",
  },
  {
    question: "Hur vet Buddy vilken försäkring som passar mig bäst?",
    answer:
      "Vi utgår från vad du berättar om det du äger, samt vad du säger är viktigast för dig (t.ex. lägre pris eller bättre skydd), och väger ihop det med de alternativ som finns.",
  },
  {
    question: "Vad händer om jag behöver anmäla en skada?",
    answer:
      "Öppna \"Anmäl skada\" i din översikt. Buddy ställer några följdfrågor, du laddar upp foton, och anmälan skickas in direkt.",
  },
  {
    question: "Kan jag prata med en riktig person?",
    answer:
      "Absolut — boka ett video- eller telefonmöte med en specialist direkt från din översikt, eller fråga Buddy att koppla dig vidare.",
  },
  {
    question: "Är mina uppgifter säkra?",
    answer:
      "Du loggar in med BankID och dina uppgifter används enbart för att ge dig relevanta förslag. Läs mer i vår integritetspolicy.",
  },
];
