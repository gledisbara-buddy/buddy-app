import { Onboarding } from "@/components/Onboarding";
import { ITEM_CATEGORIES, type ItemKind } from "@/lib/items";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; kind?: string }>;
}) {
  const { mode, kind } = await searchParams;
  const initialKind = ITEM_CATEGORIES.some((c) => c.kind === kind) ? (kind as ItemKind) : undefined;
  return <Onboarding mode={mode === "add" ? "add" : "full"} initialKind={initialKind} />;
}
