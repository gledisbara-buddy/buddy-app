import { Onboarding } from "@/components/Onboarding";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  return <Onboarding mode={mode === "add" ? "add" : "full"} />;
}
