// Delad typ för den fråga-i-taget-guiden som BilNeedsForm.tsx och
// GenericNeedsForm.tsx båda bygger på (QuestionFlow.tsx). En "step" är en
// enskild fråga — svaret sparas under sitt id i ett löst answers-objekt,
// caller tolkar/typar om det till sin egen struktur i onDone.
export type QuestionFieldType = "bool" | "pill" | "multipill" | "number" | "text";

export type QuestionOption = { value: string; label: string };

export type QuestionStep = {
  id: string;
  prompt: string;
  // Kort etikett i sammanfattningslistan — prompt är ofta en hel fråga
  // (för lång för en tät lista), summaryLabel är t.ex. "Finansiering".
  // Faller tillbaka på prompt om den saknas.
  summaryLabel?: string;
  // Buddys tips för just den här frågan — visas alltid, en per fråga.
  tip: string;
  type: QuestionFieldType;
  options?: QuestionOption[]; // pill/multipill
  required?: boolean;
  placeholder?: string;
  // Villkorad synlighet baserat på tidigare svar — samma idé som
  // dependsOn i needs.ts, fast en fri predikat istället för bara "valde
  // den här optionen".
  show?: (answers: Record<string, unknown>) => boolean;
  // Hur svaret ska skrivas ut i sammanfattningslistan — default är en
  // enkel stringify av värdet (fungerar för bool/pill/number/text, men
  // multipill och egna etiketter behöver ofta något snyggare).
  summaryValue?: (value: unknown) => string;
};
