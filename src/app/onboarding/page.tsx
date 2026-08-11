import { Onboarding } from "@/components/Onboarding";
import { ITEM_CATEGORIES, TELEKOM_TYP_LABELS, type ItemKind, type TelekomTyp } from "@/lib/items";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; kind?: string; typ?: string }>;
}) {
  const { mode, kind, typ } = await searchParams;
  const initialKind = ITEM_CATEGORIES.some((c) => c.kind === kind) ? (kind as ItemKind) : undefined;
  const initialTyp = typ && typ in TELEKOM_TYP_LABELS ? (typ as TelekomTyp) : undefined;
  return <Onboarding mode={mode === "add" ? "add" : "full"} initialKind={initialKind} initialTyp={initialTyp} />;
}
