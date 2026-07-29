import { CompareFlow } from "@/components/CompareFlow";

export default async function ComparePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CompareFlow itemId={id} />;
}
