import { notFound } from "next/navigation";
import { CompareFlow } from "@/components/CompareFlow";
import { INSURANCE_META, type InsuranceId } from "@/lib/insurance";

export default async function ComparePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(id in INSURANCE_META)) notFound();

  const meta = INSURANCE_META[id as InsuranceId];
  return <CompareFlow insuranceId={id} insuranceLabel={meta.label} />;
}
