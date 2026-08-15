import { Onboarding } from "@/components/Onboarding";
import { ITEM_CATEGORIES, TELEKOM_TYP_LABELS, type ItemKind, type TelekomTyp } from "@/lib/items";

// "mode"-parametern (historiskt "full" vid registrering vs "add" i
// efterhand) är inte längre relevant för att lägga till — Onboarding är
// numera alltid "lägg till en sak"-läget, eftersom förnamn samlas in vid
// registreringen och BankID-importen (se BankIdImport.tsx) ersatte det
// gamla namn→fullmakt→hub-flödet för nya konton. itemId signalerar
// istället redigering av en befintlig sak, se ItemDetail.tsx.
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; typ?: string; itemId?: string }>;
}) {
  const { kind, typ, itemId } = await searchParams;
  const initialKind = ITEM_CATEGORIES.some((c) => c.kind === kind) ? (kind as ItemKind) : undefined;
  const initialTyp = typ && typ in TELEKOM_TYP_LABELS ? (typ as TelekomTyp) : undefined;
  return <Onboarding initialKind={initialKind} initialTyp={initialTyp} editItemId={itemId} />;
}
